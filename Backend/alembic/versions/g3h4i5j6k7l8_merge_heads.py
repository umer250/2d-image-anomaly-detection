"""merge all heads into single linear chain

Revision ID: g3h4i5j6k7l8
Revises: c1d2e3f4a5b6, f2a3b4c5d6e7
Create Date: 2026-04-26 00:02:00.000000

"""
from alembic import op

revision = 'g3h4i5j6k7l8'
down_revision = ('c1d2e3f4a5b6', 'f2a3b4c5d6e7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass  # merge only — no schema changes


def downgrade() -> None:
    pass
