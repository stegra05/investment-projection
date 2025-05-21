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
    def test_run_projection_task_success(self, mock_calculate_projection, mock_logger, app):
        """Test successful execution of run_projection_task."""
        portfolio_id = 1
        start_date_str = "2024-01-01"
        end_date_str = "2024-12-31"
        initial_total_value_str = "10000.00"
        test_task_id = "test-task-id-success"

        mock_projection_output = [
            (date(2024, 1, 31), Decimal("10050.00")),
            (date(2024, 2, 29), Decimal("10100.25"))
        ]
        mock_calculate_projection.return_value = mock_projection_output

        # Patch self.request.id for the duration of this task execution
        with patch.object(run_projection_task.request, 'id', test_task_id):
            result = run_projection_task.run(
                portfolio_id,
                start_date_str,
                end_date_str,
                initial_total_value_str
            )

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
        mock_logger.info.assert_any_call(f"Celery Worker: Task '{test_task_id}' for PortfolioID '{portfolio_id}' COMPLETED successfully.")


    @patch('app.background_workers.current_app.logger')
    def test_run_projection_task_invalid_date_format(self, mock_logger, app):
        """Test task failure with invalid date string."""
        test_task_id = "test-task-id-bad-date"
        with patch.object(run_projection_task.request, 'id', test_task_id):
            with pytest.raises(ValueError):
                run_projection_task.run(
                    1, # portfolio_id
                    "not-a-date", # start_date_str
                    "2024-12-31", # end_date_str
                    "10000.00" # initial_total_value_str
                )
        mock_logger.error.assert_any_call(f"Celery Worker: Task '{test_task_id}' (PortfolioID '1') - ValueError (likely date format): time data 'not-a-date' does not match format '%Y-%m-%d'", exc_info=True)


    @patch('app.background_workers.current_app.logger')
    def test_run_projection_task_invalid_decimal_value(self, mock_logger, app):
        """Test task failure with invalid decimal string for initial value."""
        test_task_id = "test-task-id-bad-decimal"
        with patch.object(run_projection_task.request, 'id', test_task_id):
            with pytest.raises(InvalidOperation):
                run_projection_task.run(
                    1, # portfolio_id
                    "2024-01-01", # start_date_str
                    "2024-12-31", # end_date_str
                    "not-a-decimal" # initial_total_value_str
                )
        mock_logger.error.assert_any_call(f"Celery Worker: Task '{test_task_id}' (PortfolioID '1') - InvalidOperation (Decimal conversion): [<class 'decimal.ConversionSyntax'>]", exc_info=True)


    @patch('app.background_workers.current_app.logger')
    @patch('app.background_workers.calculate_projection')
    def test_run_projection_task_service_exception(self, mock_calculate_projection, mock_logger, app):
        """Test task failure when calculate_projection service raises an exception."""
        test_task_id = "test-task-id-service-fail"
        mock_calculate_projection.side_effect = Exception("Service internal error")

        with patch.object(run_projection_task.request, 'id', test_task_id):
            with pytest.raises(Exception, match="Service internal error"):
                run_projection_task.run(
                    1, # portfolio_id
                    "2024-01-01", # start_date_str
                    "2024-12-31", # end_date_str
                    "10000.00" # initial_total_value_str
                )
        mock_logger.error.assert_any_call(f"Celery Worker: Task '{test_task_id}' (PortfolioID '1') - Unhandled error: Service internal error", exc_info=True)

    # Test direct invocation if preferred (works with CELERY_TASK_ALWAYS_EAGER)
    # This is an alternative to the self-binding method above
    @patch('app.background_workers.current_app.logger')
    @patch('app.background_workers.calculate_projection')
    def test_run_projection_task_success_direct_call(self, mock_calculate_projection, mock_logger, app):
        """Test successful execution of run_projection_task called directly."""
        portfolio_id = 2
        start_date_str = "2025-01-01"
        end_date_str = "2025-06-30"
        initial_total_value_str = "5000.50"
        test_task_id = "test-task-id-direct"

        mock_projection_output = [(date(2025, 1, 31), Decimal("5010.00"))]
        mock_calculate_projection.return_value = mock_projection_output
        
        with patch.object(run_projection_task.request, 'id', test_task_id):
            result = run_projection_task.run(
                portfolio_id,
                start_date_str,
                end_date_str,
                initial_total_value_str
            )

        mock_calculate_projection.assert_called_once_with(
            portfolio_id=portfolio_id,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            initial_total_value=Decimal("5000.50")
        )
        expected_formatted_data = {"2025-01-31": "5010.00"}
        assert result['data'] == expected_formatted_data
        assert result['status'] == "SUCCESS"
