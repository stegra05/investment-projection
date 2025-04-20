from app.models import Portfolio

def test_portfolio_to_dict_keys():
    p = Portfolio(user_id=42, name='Test Name', description='Test Desc')
    data = p.to_dict()
    # Basic attributes
    assert data['user_id'] == 42
    assert data['name'] == 'Test Name'
    assert data['description'] == 'Test Desc'
    # to_dict should include portfolio_id, created_at, and updated_at keys
    assert 'portfolio_id' in data
    assert 'created_at' in data
    assert 'updated_at' in data
    # created_at and updated_at default to None if not persisted
    assert data['created_at'] is None
    assert data['updated_at'] is None 