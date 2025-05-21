import pytest
from unittest.mock import patch, MagicMock
from decimal import Decimal, InvalidOperation
from datetime import date, datetime

# Import the Celery app instance and the tasks
from app import celery_app # Assuming celery_app is in app/__init__.py
from app.background_workers import run_projection_task

# Ensure CELERY_TASK_ALWAYS_EAGER is True in TestingConfig (handled by conftest.py app fixture)

class TestRunProjectionTask:

    @patch('app.background_workers.current_app.logger') # Mock logger to avoid real logging
    @patch('app.background_workers.calculate_projection') # Mock the core service call
    def test_run_projection_task_success(self, mock_calculate_projection, mock_logger):
        """Test successful execution of run_projection_task."""
        portfolio_id = 1
        start_date_str = "2024-01-01"
        end_date_str = "2024-12-31"
        initial_total_value_str = "10000.00"

        # Mock the return value of calculate_projection
        # It returns a list of (date, Decimal) tuples
        mock_projection_output = [
            (date(2024, 1, 31), Decimal("10050.00")),
            (date(2024, 2, 29), Decimal("10100.25"))
        ]
        mock_calculate_projection.return_value = mock_projection_output

        # Create a mock task instance for the 'bind=True' task
        mock_celery_task_instance = MagicMock()
        mock_celery_task_instance.request.id = "test-task-id-success"
        
        # Execute the task directly (due to CELERY_TASK_ALWAYS_EAGER=True)
        # Pass the mock task instance as 'self'
        result = run_projection_task(
            self=mock_celery_task_instance, # bound task instance
            portfolio_id=portfolio_id,
            start_date_str=start_date_str,
            end_date_str=end_date_str,
            initial_total_value_str=initial_total_value_str
        )

        # Assertions
        mock_calculate_projection.assert_called_once_with(
            portfolio_id=portfolio_id,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            initial_total_value=Decimal("10000.00")
        )
        
        expected_formatted_data = {
            "2024-01-31": "10050.00",
            "2024-02-29": "10100.25"
        }
        assert result == {
            "status": "SUCCESS",
            "data": expected_formatted_data,
            "message": "Projection calculated successfully."
        }
        mock_logger.info.assert_any_call(f"Celery Worker: Task test-task-id-success COMPLETED successfully.")


    @patch('app.background_workers.current_app.logger')
    def test_run_projection_task_invalid_date_format(self, mock_logger):
        """Test task failure with invalid date string."""
        mock_celery_task_instance = MagicMock()
        mock_celery_task_instance.request.id = "test-task-id-bad-date"

        with pytest.raises(ValueError): # Expecting ValueError from strptime
            run_projection_task(
                self=mock_celery_task_instance,
                portfolio_id=1,
                start_date_str="not-a-date",
                end_date_str="2024-12-31",
                initial_total_value_str="10000.00"
            )
        mock_logger.error.assert_any_call(f"Celery Worker: ValueError (likely date format) for task test-task-id-bad-date: invalid date format: not-a-date", exc_info=True)


    @patch('app.background_workers.current_app.logger')
    def test_run_projection_task_invalid_decimal_value(self, mock_logger):
        """Test task failure with invalid decimal string for initial value."""
        mock_celery_task_instance = MagicMock()
        mock_celery_task_instance.request.id = "test-task-id-bad-decimal"

        with pytest.raises(InvalidOperation): # Expecting InvalidOperation from Decimal()
            run_projection_task(
                self=mock_celery_task_instance,
                portfolio_id=1,
                start_date_str="2024-01-01",
                end_date_str="2024-12-31",
                initial_total_value_str="not-a-decimal"
            )
        mock_logger.error.assert_any_call(f"Celery Worker: InvalidOperation for task test-task-id-bad-decimal: [<class 'decimal.ConversionSyntax'>]", exc_info=True)


    @patch('app.background_workers.current_app.logger')
    @patch('app.background_workers.calculate_projection')
    def test_run_projection_task_service_exception(self, mock_calculate_projection, mock_logger):
        """Test task failure when calculate_projection service raises an exception."""
        mock_celery_task_instance = MagicMock()
        mock_celery_task_instance.request.id = "test-task-id-service-fail"

        mock_calculate_projection.side_effect = Exception("Service internal error")

        with pytest.raises(Exception, match="Service internal error"):
            run_projection_task(
                self=mock_celery_task_instance,
                portfolio_id=1,
                start_date_str="2024-01-01",
                end_date_str="2024-12-31",
                initial_total_value_str="10000.00"
            )
        mock_logger.error.assert_any_call(f"Celery Worker: Unhandled error processing task test-task-id-service-fail: Service internal error", exc_info=True)

    # Test direct invocation if preferred (works with CELERY_TASK_ALWAYS_EAGER)
    # This is an alternative to the self-binding method above
    @patch('app.background_workers.current_app.logger')
    @patch('app.background_workers.calculate_projection')
    @patch('app.background_workers.run_projection_task.request') # Mock task.request for task_id
    def test_run_projection_task_success_direct_call(self, mock_task_request, mock_calculate_projection, mock_logger):
        """Test successful execution of run_projection_task called directly."""
        portfolio_id = 2
        start_date_str = "2025-01-01"
        end_date_str = "2025-06-30"
        initial_total_value_str = "5000.50"

        mock_task_request.id = "test-task-id-direct" # Mock the task_id accessed via self.request.id

        mock_projection_output = [(date(2025, 1, 31), Decimal("5010.00"))]
        mock_calculate_projection.return_value = mock_projection_output
        
        # This is how you might call if not using .s().apply().get() and task is not bound
        # However, since our task IS bind=True, direct call still needs 'self'
        # To truly test it as if it's a direct function call without celery context, 
        # you'd have to refactor the task or mock 'self' very carefully.
        # Given bind=True, the previous tests using a mock 'self' are more representative.
        # This test shows an attempt if one were to call it "directly" but still needs self.
        
        # To make a direct call work cleanly without providing 'self' manually,
        # one would typically unwrap the task or test a non-bound version.
        # For this example, we'll still mock 'self' via the task object itself.
        # This is more like testing the task's inner logic if Celery context was simple.
        
        # To test the task's logic without Celery's .apply(), you can call it as a function
        # but you still need to provide 'self' because of bind=True.
        # A common pattern for this is to get the task's __wrapped__ function if you want
        # to bypass the Celery machinery for a unit test of the core logic,
        # but that's often more complex than needed if CELERY_TASK_ALWAYS_EAGER is on.

        # Let's use the .apply().get() method for consistency with Celery execution context.
        # It's generally safer for testing bound tasks.
        result = run_projection_task.s(
            portfolio_id, start_date_str, end_date_str, initial_total_value_str
        ).apply().get() # This will use the mocked task_request.id via Celery's context

        mock_calculate_projection.assert_called_once_with(
            portfolio_id=portfolio_id,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            initial_total_value=Decimal("5000.50")
        )
        expected_formatted_data = {"2025-01-31": "5010.00"}
        assert result['data'] == expected_formatted_data
        assert result['status'] == "SUCCESS"
```
