"""add day_list_item_id to files

Revision ID: 95d6c53da2c8
Revises: 78d87219eadd
Create Date: 2026-09-15 20:51:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '95d6c53da2c8'
down_revision: Union[str, Sequence[str], None] = '78d87219eadd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('files', sa.Column('day_list_item_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_files_day_list_item_id'), 'files', ['day_list_item_id'], unique=False)
    op.create_foreign_key(
        op.f('files_day_list_item_id_fkey'), 'files', 'day_list_items', ['day_list_item_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(op.f('files_day_list_item_id_fkey'), 'files', type_='foreignkey')
    op.drop_index(op.f('ix_files_day_list_item_id'), table_name='files')
    op.drop_column('files', 'day_list_item_id')
