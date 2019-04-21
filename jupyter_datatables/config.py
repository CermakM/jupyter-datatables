# jupyter-tools
# Copyright 2019 Marek Cermak <macermak@redhat.com>

"""Default configuration for Jupyter datatables tool."""

from collections import namedtuple

__all__ = ['defaults']


_DEFAULT_CONFIG = {
    'classes': ['table', 'cell-border', 'nowrap'],
    'options': {
        'columnDefs': [
            {
                # this is the first column, assuming this is index of the table
                'searchable': False,
                'width': '5%',
                'targets': 0,
            },
            {
                'targets': '_all',
                'className': 'dt-body-center dt-head-center'
            }
        ],
        'buttons': [
            'print', 'csv', 'pdf'
        ],

        'ordering': True,
        'paging': True,

        'responsive': True,

        'scrollX': True,
        'scrollY': False,

        'searching': True,
    },
    'extensions': {
        'buttons': True,
        'responsive': True,
        'scroller': True,
        'select': True
    },
    'limit': 1000,  # beyond this limit a sample is taken
    'sample_size': None,
    'warnings': True,
}

DefaultDataTablesConfig = namedtuple('DefaultConfig', _DEFAULT_CONFIG.keys())

defaults = DefaultDataTablesConfig(**_DEFAULT_CONFIG)
"""Default configuration for Jupyter datatables tools."""
