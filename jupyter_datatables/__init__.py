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
from jupyter_require import execute_with_requirements

_HERE = Path(__file__).parent


def init_datatables_mode(options: dict = None):
    """Initialize DataTable mode for pandas DataFrame represenation."""
    from .config import defaults

    # extensions to be loaded
    extensions = defaults.extensions

    opts = defaults.options
    opts.update(options or {})

    # configure path to the datatables library using requireJS
    libs = OrderedDict({
        'datatables.net': 'https://cdn.datatables.net/1.10.18/js/jquery.dataTables.min',
        'd3': 'https://d3js.org/d3.v5.min'
    })
    shim = OrderedDict({
        'datatables.net': {
            'exports': '$.fn.dataTable'
        },
    })

    bundles = OrderedDict()

    if extensions.get('buttons', False):
        lib = 'datatables.net-buttons'

        libs[lib] = 'https://cdn.datatables.net/buttons/1.5.6/js/dataTables.buttons.min'
        shim[lib] = {
            'deps': ['datatables.net']
        }

        # required to export Excel file, must be loaded first
        libs['jszip'] = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min'

        bundles[lib] = {
            'buttons.colvis': 'https://cdn.datatables.net/buttons/1.5.6/js/buttons.colVis.min',
            'buttons.flash':  'https://cdn.datatables.net/buttons/1.5.6/js/buttons.flash.min',
            'buttons.html5':  'https://cdn.datatables.net/buttons/1.5.6/js/buttons.html5.min',
            'buttons.print':  'https://cdn.datatables.net/buttons/1.5.6/js/buttons.print.min',
        }
        for bundle, path in bundles[lib].items():
            libs[bundle] = path
            shim[bundle] = {
                'deps': ['jszip', lib],
            }

        # requirements for correct Buttons functionality
        libs['pdfmake'] = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/pdfmake.min'
        shim['pdfmake'] = {
            'deps': ["datatables.net"]
        }
        libs['vfsfonts'] = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.36/vfs_fonts'
        shim['vfsfonts'] = {
            'deps': ["datatables.net"]
        }

    if extensions.get('scroller', False):
        libs['datatables.scroller'] = 'https://cdn.datatables.net/' \
                                      'scroller/2.0.0/js/dataTables.scroller.min'  # Scroll

    if extensions.get('select', False):
        libs['datatables.select'] = 'https://cdn.datatables.net/' \
                                    'select/1.3.0/js/dataTables.select.min'  # Select

    require.config(libs=libs, shim=shim)

    # link stylesheets
    link_css('https://cdn.datatables.net/v/dt/'
             'dt-1.10.18/'  # DataTables
             'af-2.3.3/'  # AutoFill
             'b-1.5.6/'   # Buttons
             'b-colvis-1.5.6/'  # Buttons - Column Visibility
             'b-flash-1.5.6/'   # Buttons - Flash
             'b-html5-1.5.6/'   # Buttons - HTML5
             'b-print-1.5.6/'   # Buttons - Print View
             'cr-1.5.0/'  # ColReorder
             'fc-3.2.5/'  # FixedColumns
             'fh-3.1.4/'  # FixedHeader
             'kt-2.5.0/'  # KeyTable
             'r-2.2.2/'   # Responsive
             'rg-1.1.0/'  # RowGroup
             'rr-1.2.4/'  # RowReorder
             'sc-2.0.0/'  # Scroll
             'sl-1.3.0/'  # Select
             'datatables.min.css')

    # load custom style
    load_css(
        Path(_HERE, '../assets/main.css').read_text(encoding='utf-8'), {'id': 'datatables-main-css'})

    def _repr_datatable_(self):
        """Return DataTable representation of pandas DataFrame."""
        # classes for dataframe table
        classes = ' '.join(defaults.classes)
        buttons = opts.pop('buttons', [])

        # create table DOM
        script = """
            const table = $.parseHTML(`$$html`);
            
            let plot = function(data, container, margin) {
                margin = margin || { left: 5, right: 5, top: 10, bottom: 10};

                const width  = 600;
                const height = 400;

                let x_range = d3.scaleBand()
                    .range([0, width])
                    .padding(0.1)
                    .domain(data);
                
                let y_range = d3.scaleLinear()
                    .range([height, 0])
                    .domain([0, d3.max(data)]);
                
                let svg_container = d3.select(container)
                    .append('div')
                    .classed('svg-container', true);

                let svg = svg_container.append('svg')
                    .attr('preserveAspectRatio', 'xMinYMin meet')
                    .attr('viewBox', `0 0 ${width} ${height}`)
                    .classed('svg-content', true);
                let g = svg
                    .append('g')
                    .classed('bars', true);

                g.selectAll('.bar')
                    .data(data)
                    .enter()
                    .append('rect')
                    .attr('x', (d) => x_range(d))
                    .attr('y', (d) => y_range(d))
                    .attr('width', x_range.bandwidth())
                    .attr('height', (d) => height - y_range(d))
                    .attr('fill', 'steelblue')
                    .classed('bar', true);

                return svg;
            };
            
            $(table).ready( () => {
                let dt = $(table).DataTable($$opts);
                let buttons = new $.fn.dataTable.Buttons( dt, {
                    buttons: $$buttons
                });
            
                $(dt.table().container()).prepend(buttons.container());
                
                /* Data preview */
                const $header = $(dt.table().header());
                const col_width  = $header.find('th').width(),
                      col_height = $header.find('th').height(); 
                
                let $column_preview = $(dt.row(0).node())
                    .clone()
                    .attr('class', 'data-preview');
                                
                let $data_columns = $column_preview
                    .children()
                      .empty()
                      .removeAttr('aria-controls')
                      .removeAttr('aria-label')
                      .removeClass()  // remove all classes
                    .siblings('td')
                      .attr('role', 'figure')
                      .addClass('column-data-preview');

                $data_columns.each((i, elt) => {
                    const data = dt.row(i).data();
                    
                    $(elt)
                        .attr('aria-label', `data preview for column ${$(elt).text()}`);
                    
                    plot(data, elt);
                });

                $header.after($column_preview);
                        
            });
        
            element.append(table);
        """

        execute_with_requirements(script,
                                  required=['datatables.net', 'd3'],
                                  html=self.to_html(classes=classes),
                                  opts=json.dumps(opts),
                                  buttons=buttons)

        return ""

    pd.DataFrame._repr_javascript_ = _repr_datatable_
