define('jupyter-datatables', function (require) {
    let DT = require("datatables.net");
    let d3 = require("d3");

    let plot = function (data, container, margin) {
        margin = margin || {
            left: 5,
            right: 5,
            top: 10,
            bottom: 10
        };

        const width = 600;
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