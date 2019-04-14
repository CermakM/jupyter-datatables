define('jupyter-datatables', function (require) {
    let DT = require("datatables.net");
    let d3 = require("d3");

    let plot = function (data, container, margin) {
            const width  = 600,
                  height = 400;
            
            // TODO: Implement Freedman-Diaconis rule
            const n_bins = 10;

            margin = {
                left: 5,
                right: 5,
                top: 10,
                bottom: 10
            };

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

            let x_range = d3.scaleLinear()
                .domain(d3.extent(data))
                .nice()
                .range([0, width]);

            let bins = d3.histogram()
                .domain(x_range.domain())
                .thresholds(x_range.ticks(n_bins))
                (data);

            let y_range = d3.scaleLinear()
                .domain([0, d3.max(bins, d => d.length)])
                .nice()
                .range([height, 0]); // reverse the domain

            g.selectAll('.bar')
                .data(bins)
                .enter()
                .append('rect')
                .attr('x', (d) => x_range(d.x0) + 1)
                .attr('y', (d) => y_range(d.length))
                .attr('width', (d) => Math.max(0, x_range(d.x1) - x_range(d.x0) - 1))
                .attr('height', (d) => y_range(0) - y_range(d.length))
                .attr('fill', 'steelblue')
                .classed('bar', true);

        return svg;
    };

    /**
        * 
        * @param {_Api} settings - DataTables settings _Api
        * @param {Object} options 
        */
    function DataPreview(settings, options) {
        this.dt = settings.oInstance.api();
        this.data = this.dt.data();

        this.preview = null;

        this.container = $(settings.nTHead);
    }

    DataPreview.prototype.create_preview = function () {
        let data_preview = $(this.dt.row(0).node())
            .clone()
            .removeClass();

        data_preview
            .children()
            .empty()
            .removeAttr('aria-controls')
            .removeAttr('aria-label')
            .removeClass() // remove all classes
            .siblings('td')
            .attr('role', 'figure')
            .addClass('column-data-preview');

        data_preview.children().each((i, elt) => {
            if ($(elt).is('th')) // skip indices
                return;

            const data = this.dt.column(i).data();
            $(elt)
                .attr('aria-label', `data preview for column ${$(elt).text()}`);

            plot(data, elt);
        });

        data_preview.ready(() => {
            this.preview = data_preview
                .attr('class', 'data-preview')
                .append(data_preview);

            console.debug("Data preview created.", this.preview);
        });

        return this;
    }

    DataPreview.prototype.draw = function () {
        return this.ready((elt) => {
            $(this.container)
                .append(this.preview);
        });
    };

    DataPreview.prototype.ready = function (f) {
        return $(this.preview).ready(f);
    };


    $.fn.dataTable.DataPreview = DataPreview;
    $.fn.DataTable.DataPreview = $.fn.dataTable.DataPreview;

    $.fn.dataTable.ext.previews = {};


    let create_datatable = function (table, options, buttons) {
        return new Promise((resolve) => {
            Object.assign(options, {
                fnInitComplete: function (settings) {
                    let previews = $.fn.dataTable.ext.previews;
                    let table_id = settings.sTableId;

                    let dataPreview = null;
                    if (!_.has(previews, table_id)) {
                        console.debug('Data preview initialization.', settings);

                        dataPreview = new $.fn.dataTable.DataPreview(settings);
                        previews[table_id] = dataPreview.create_preview();
                    } else {
                        dataPreview = previews[settings.sTableId];
                    }

                    dataPreview.draw();

                    resolve(settings);
                }
            })
            let dt = $(table).DataTable(options);
            let btns = new $.fn.dataTable.Buttons(dt, {
                buttons: buttons
            });

            $(dt.table().container()).prepend(btns.container());
        });
    };

    /**
     * Create HTML table from raw String and append it to an element
     * 
     * @param {String} html 
     * @param {Element} element 
     */
    let append_table = function (html, element) {
        return new Promise((resolve) => {
            const table = $.parseHTML(html);

            $(table).ready(() => {
                element.append(table);
                resolve(table);
            });
        });
    };

    /**
     * Create DataTable from raw string and append it to an element
     */
    return append_datatable = async function (html, options, buttons, element) {
        const table = await append_table(html, element);

        return create_datatable(table, options, buttons);
    };
});