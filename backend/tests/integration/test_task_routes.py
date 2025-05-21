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


@patch('app.routes.tasks.celery_app.AsyncResult')
def test_get_task_status_success_state(mock_async_result, auth_client, user_factory, session):
    user = auth_client.user # Task will be associated with this user
    celery_task_id = "celery-task-success"
    
    # Store a record of this task for the user
    UserCeleryTask.create_task_for_user(user_id=user.id, task_id=celery_task_id)
    session.commit()

    mock_celery_task = MagicMock()
    mock_celery_task.state = 'SUCCESS'
    mock_celery_task.result = {'data': 'some success data', 'portfolio_id': 1} # Example result
    mock_async_result.return_value = mock_celery_task

    response = auth_client.get(f'/tasks/{celery_task_id}/status')
    assert response.status_code == 200
    data = response.get_json()
    assert data['task_id'] == celery_task_id
    assert data['status'] == 'SUCCESS'
    assert data['result'] == mock_celery_task.result
    mock_async_result.assert_called_with(celery_task_id)

@patch('app.routes.tasks.celery_app.AsyncResult')
def test_get_task_status_failure_state(mock_async_result, auth_client, session):
    user = auth_client.user
    celery_task_id = "celery-task-failure"
    UserCeleryTask.create_task_for_user(user_id=user.id, task_id=celery_task_id)
    session.commit()

    mock_celery_task = MagicMock()
    mock_celery_task.state = 'FAILURE'
    mock_celery_task.result = {'error': 'Something went wrong'} # Example error structure
    mock_celery_task.traceback = "Traceback details..."
    mock_async_result.return_value = mock_celery_task

    response = auth_client.get(f'/tasks/{celery_task_id}/status')
    assert response.status_code == 200 # Or 500 if task failure implies server error for this endpoint
    data = response.get_json()
    assert data['status'] == 'FAILURE'
    assert data['result']['error'] == 'Something went wrong'
    assert 'traceback' in data['result'] # Assuming traceback is included on failure

@patch('app.routes.tasks.celery_app.AsyncResult')
def test_get_task_status_pending_state(mock_async_result, auth_client, session):
    user = auth_client.user
    celery_task_id = "celery-task-pending"
    UserCeleryTask.create_task_for_user(user_id=user.id, task_id=celery_task_id)
    session.commit()

    mock_celery_task = MagicMock()
    mock_celery_task.state = 'PENDING'
    mock_celery_task.result = None
    mock_async_result.return_value = mock_celery_task

    response = auth_client.get(f'/tasks/{celery_task_id}/status')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'PENDING'

def test_get_task_status_db_record_not_found(auth_client):
    # Celery might know about the task, but if UserCeleryTask record is missing, it's unauthorized / not found for user
    response = auth_client.get('/tasks/unknown-db-task-id/status')
    assert response.status_code == 404 

def test_get_task_status_unauthorized_other_user_task(auth_client, user_factory, session):
    # Task belongs to another_user
    other_user = user_factory(email='othertask@example.com', username='othertaskuser')
    other_task_id = "other-user-task"
    UserCeleryTask.create_task_for_user(user_id=other_user.id, task_id=other_task_id)
    session.commit()

    # auth_client is logged in as a different user
    response = auth_client.get(f'/tasks/{other_task_id}/status')
    assert response.status_code == 403 # Or 404


# === Test GET /tasks/run-example-task (Example Task Trigger) ===
@patch('app.routes.tasks.example_task.delay')
def test_run_example_task_route(mock_example_task_delay, auth_client, session):
    mock_example_task_delay.return_value = MagicMock(id="example-task-id-456")
    user_id_from_auth_client = auth_client.user.id

    response = auth_client.get('/tasks/run-example-task')
    assert response.status_code == 202
    data = response.get_json()
    assert data['message'] == "Example task triggered successfully"
    assert data['task_id'] == "example-task-id-456"

    mock_example_task_delay.assert_called_once_with(user_id_from_auth_client, ANY) # ANY for optional params
    # Check if UserCeleryTask record was created
    task_record = UserCeleryTask.query.filter_by(task_id="example-task-id-456", user_id=user_id_from_auth_client).first()
    assert task_record is not None 