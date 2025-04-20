from setuptools import setup, find_packages

setup(
    name='investment_projection_backend',
    version='0.1.0',
    packages=find_packages(),
    install_requires=[
        'Flask>=2.0',
        'Flask-SQLAlchemy>=2.5',
        'Flask-Migrate>=3.0',
        'Flask-CORS>=3.0',
        'python-dotenv>=0.19',
        'bcrypt>=3.2',
        'psycopg2-binary>=2.9',
        'Flask-JWT-Extended>=4.0',
        'python-dateutil',
        'pytest>=7.0',
    ],
) 