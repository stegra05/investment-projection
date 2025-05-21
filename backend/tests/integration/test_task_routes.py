import pytest
import json
from unittest.mock import patch, MagicMock
from app.models.user import User 
from app.models.user_celery_task import UserCeleryTask
from app import db 
from datetime import datetime

# Fixture for an authenticated user for task tests
@pytest.fixture
def task_route_user(client, user_factory, session):
    email = 'taskrouteuser@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password123', username='taskrouteuser')
    
    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}

@pytest.fixture
def other_task_route_user(client, user_factory, session):
    email = 'othertaskrouteuser@example.com'
    user = session.query(User).filter_by(email=email).first()
    if not user:
        user = user_factory(email=email, password='password456', username='othertaskrouteuser')

    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': 'password456'})
    access_token = login_response.get_json()['access_token']
    return user, {'Authorization': f'Bearer {access_token}'}


# Base URL for task status
def task_status_url(task_id):
    return f'/api/v1/tasks/{task_id}' # Corrected: No /status suffix based on routes.py


@patch('app.routes.tasks.get_task_status') # Patch the service function used by the route
def test_get_task_status_success_state(mock_get_task_status_svc, client, task_route_user, session):
    """Test getting status for a task that completed successfully and is owned by user."""
    user, headers = task_route_user
    test_task_id = "celery-task-owned-success"

    # 1. Create UserCeleryTask record for ownership check
    task_record = UserCeleryTask(user_id=user.id, task_id=test_task_id, task_name='test_projection')
    session.add(task_record)
    session.commit()

    # 2. Mock the response from the task_service.get_task_status function
    mock_service_response = {
        "task_id": test_task_id,
        "status": "COMPLETED", # Service maps from Celery "SUCCESS"
        "result": {"data": "some_result", "value": 123},
        "message": "Task completed successfully.",
        "error": None,
        "created_at": None, # Placeholder from service
        "updated_at": datetime.utcnow().isoformat()
    }
    mock_get_task_status_svc.return_value = mock_service_response
    
    response = client.get(task_status_url(test_task_id), headers=headers)
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['task_id'] == test_task_id
    assert json_data['status'] == 'COMPLETED'
    assert json_data['result'] == {"data": "some_result", "value": 123}
    
    mock_get_task_status_svc.assert_called_once_with(test_task_id)


@patch('app.routes.tasks.get_task_status')
def test_get_task_status_failure_state(mock_get_task_status_svc, client, task_route_user, session):
    """Test getting status for a task that failed and is owned by user."""
    user, headers = task_route_user
    test_task_id = "celery-task-owned-failure"

    task_record = UserCeleryTask(user_id=user.id, task_id=test_task_id, task_name='test_failure')
    session.add(task_record)
    session.commit()

    mock_service_response = {
        "task_id": test_task_id,
        "status": "FAILED", # Service maps from Celery "FAILURE"
        "result": None,
        "message": "Task failed. See error field for details.",
        "error": "Error: Something went wrong",
        "created_at": None,
        "updated_at": datetime.utcnow().isoformat()
    }
    mock_get_task_status_svc.return_value = mock_service_response

    response = client.get(task_status_url(test_task_id), headers=headers)
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['task_id'] == test_task_id
    assert json_data['status'] == 'FAILED'
    assert "Error: Something went wrong" in str(json_data['error'])
    mock_get_task_status_svc.assert_called_once_with(test_task_id)


@patch('app.routes.tasks.get_task_status')
def test_get_task_status_pending_state(mock_get_task_status_svc, client, task_route_user, session):
    """Test getting status for a task that is pending and is owned by user."""
    user, headers = task_route_user
    test_task_id = "celery-task-owned-pending"

    task_record = UserCeleryTask(user_id=user.id, task_id=test_task_id, task_name='test_pending')
    session.add(task_record)
    session.commit()

    mock_service_response = {
        "task_id": test_task_id,
        "status": "PENDING",
        "result": None,
        "message": "Task is pending.",
        "error": None,
        "created_at": None,
        "updated_at": None
    }
    mock_get_task_status_svc.return_value = mock_service_response

    response = client.get(task_status_url(test_task_id), headers=headers)
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['task_id'] == test_task_id
    assert json_data['status'] == 'PENDING'
    assert json_data.get('result') is None
    mock_get_task_status_svc.assert_called_once_with(test_task_id)


def test_get_task_status_db_record_not_found(client, task_route_user):
    """Test getting status for a task ID not in UserCeleryTask for the user."""
    user, headers = task_route_user
    non_existent_task_id = "non-existent-task-for-user"
    
    # No UserCeleryTask record created for this task_id and user
    # The route's UserCeleryTask.query...first_or_404() should trigger a 404
    
    response = client.get(task_status_url(non_existent_task_id), headers=headers)
    assert response.status_code == 404
    json_data = response.get_json()
    assert f"Task with ID {non_existent_task_id} not found" in json_data.get('description', json_data.get('message', ''))


def test_get_task_status_unauthorized_other_user_task(client, task_route_user, other_task_route_user, session):
    """Test user A trying to get status of user B's task."""
    user_a, headers_a = task_route_user
    user_b, _ = other_task_route_user # Don't need headers_b for this test logic
    
    task_id_for_user_b = "task-for-user-b-only"
    
    # Create task record owned by User B
    task_record_b = UserCeleryTask(user_id=user_b.id, task_id=task_id_for_user_b, task_name='user_b_task')
    session.add(task_record_b)
    session.commit()
    
    # User A attempts to access User B's task status
    response = client.get(task_status_url(task_id_for_user_b), headers=headers_a)
    
    # Should be 404 because the query filters by current_user.id
    assert response.status_code == 404 
    json_data = response.get_json()
    assert f"Task with ID {task_id_for_user_b} not found" in json_data.get('description', json_data.get('message', ''))


def test_get_task_status_no_auth_token(client):
    """Test getting task status without authentication token."""
    response = client.get(task_status_url("some-task-id-no-auth"))
    assert response.status_code == 401 # jwt_required


# --- Optional: Test for the example task initiation route ---
@patch('app.routes.tasks.db.session.commit')
@patch('app.routes.tasks.UserCeleryTask.create_task_for_user')
@patch('app.routes.tasks.current_app.logger') # To avoid real logging during test
def test_run_example_task_route(mock_logger, mock_create_user_task, mock_db_commit, client, task_route_user):
    user, headers = task_route_user

    response = client.post('/api/v1/tasks/run_example_task', headers=headers)
    assert response.status_code == 202
    json_data = response.get_json()
    assert json_data['message'] == "Example task initiated"
    assert "fake-task-id-for-example-" in json_data['task_id']
    
    mock_create_user_task.assert_called_once()
    mock_db_commit.assert_called_once()
```
