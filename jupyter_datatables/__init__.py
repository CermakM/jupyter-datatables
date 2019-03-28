# jupyter-tools
# Copyright 2019 Marek Cermak <macermak@redhat.com>
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

"""Jupyter interactive pandas DataFrame representation."""

import json
import pandas as pd

from collections import OrderedDict
from pathlib import Path

from jupyter_require import require
from jupyter_require import link_css
from jupyter_require import load_css

from jupyter_require.core import JSTemplate

from .config import defaults


_HERE = Path(__file__).parent


def init_datatables_mode(options: dict = None):
    """Initialize DataTable mode for pandas DataFrame represenation."""
    # configure path to the datatables library using requireJS
    # that way the library will become globally available
    # simple:
    # require('datatables', 'https://cdn.datatables.net/1.10.19/js/jquery.dataTables.min')
    # or for extensions and plugins uncomment following:
    require.config(
        libs=OrderedDict({
            'pdfmake': 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/pdfmake.min',
            'vfsfonts': 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/vfs_fonts',
            'datatables.net': 'https://cdn.datatables.net/v/dt/'
                              'dt-1.10.18/'  # DataTables
                              # 'af-2.3.2/'  # AutoFill
                              # 'b-1.5.4/'   # Buttons
                              # 'b-colvis-1.5.4/' # Buttons - Column Visibility
                              # 'b-flash-1.5.4/'  # Buttons - Flash
                              # 'b-html5-1.5.4/'  # Buttons - HTML5
                              # 'b-print-1.5.4/'  # Buttons - Print View
                              # 'cr-1.5.0/'  # ColReorder
                              # 'fc-3.2.5/'  # FixedColumns
                              # 'fh-3.1.4/'  # FixedHeader
                              # 'kt-2.5.0/'  # KeyTable
                              # 'r-2.2.2/'   # Responsive
                              # 'rg-1.1.0/'  # RowGroup
                              # 'rr-1.2.4/'  # RowReorder
                              'sc-1.5.0/'  # Scroll
                              'sl-1.2.6/'  # Select
                              'datatables.min',
        }),
        shim=OrderedDict({
            'datatables.net': {
                'exports': '$.fn.dataTable'
            },
            'pdfmake': {
                'deps': ["datatables.net"]
            },
            'vfsfonts': {
                'deps': ["datatables.net", "pdfmake"]
            },
        })
    )

    opts = defaults.options
    opts.update(options or {})

    # link stylesheets
    # link_css('https://cdn.datatables.net/1.10.19/css/jquery.dataTables.css')  # simple
    link_css('https://cdn.datatables.net/v/dt/'
             'dt-1.10.18/'  # DataTables
             # 'af-2.3.2/'  # AutoFill
             # 'b-1.5.4/'   # Buttons
             # 'b-colvis-1.5.4/' # Buttons - Column Visibility
             # 'b-flash-1.5.4/'  # Buttons - Flash
             # 'b-html5-1.5.4/'  # Buttons - HTML5
             # 'b-print-1.5.4/'  # Buttons - Print View
             # 'cr-1.5.0/'  # ColReorder
             # 'fc-3.2.5/'  # FixedColumns
             # 'fh-3.1.4/'  # FixedHeader
             # 'kt-2.5.0/'  # KeyTable
             # 'r-2.2.2/'   # Responsive
             # 'rg-1.1.0/'  # RowGroup
             # 'rr-1.2.4/'  # RowReorder
             'sc-1.5.0/'  # Scroll
             'sl-1.2.6/'  # Select
             'datatables.min.css')

    # load custom style
    load_css(
        Path(_HERE, './main.css').read_text(encoding='utf-8'), {'id': 'datatables-stylesheet'})

    def _repr_datatable_(self):
        """Return DataTable representation of pandas DataFrame."""
        # classes for dataframe table (optional)
        classes = ['table', 'table-striped', 'table-bordered']

        # create table DOM
        script = (
            f"const table = $.parseHTML(`{self.to_html(classes=classes)}`);"
            """
            $(table).ready( () => {
                // Turn existing table into datatable
                $(table).DataTable($$opts);
            })
            
            $(element).append(table);
            """
        )

        template = JSTemplate(script)

        return template.safe_substitute(opts=json.dumps(opts))

    pd.DataFrame._repr_javascript_ = _repr_datatable_
