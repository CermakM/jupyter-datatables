# jupyter-tools
# Copyright 2019 Marek Cermak <macermak@redhat.com>

"""Default configuration for Jupyter datatables tool."""

from collections import namedtuple

__all__ = ['defaults']


_DEFAULT_CONFIG = {
    'classes': ['table', 'cell-border'],
    'options': {
        'columnDefs': [
            {
                'targets': '_all',
                'className': 'dt-body-center dt-head-center'
            }
        ],
        'buttons': [
            'print', 'csv', 'pdf'  # FIXME: 'excel' button does not appear
        ],
        'ordering': True,
        'paging': True,
        'scrollX': False,  # FIXME: This option when set to True causes styling issues
        'scrollY': False,
        'searching': True,
    },
    'extensions': {
        'buttons': True,
        'scroller': True,
        'select': True
    },
    'warnings': True,
}

DefaultDataTablesConfig = namedtuple('DefaultConfig', _DEFAULT_CONFIG.keys())

defaults = DefaultDataTablesConfig(**_DEFAULT_CONFIG)
"""Default configuration for Jupyter datatables tools."""
