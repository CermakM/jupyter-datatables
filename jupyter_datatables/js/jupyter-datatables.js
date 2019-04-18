define('jupyter-datatables', function (require) {
    let events = require("base/js/events");
    let d3 = require("d3");
    let DT = require("datatables.net");

    let _hist_bin_fd = function(a) {
        return 2 * (d3.quantile(a, .75) - d3.quantile(a, .25)) * Math.pow(a.length, -1 / 3);
    };

    let _hist_bin_sturges = function(a) {
        return ( a[a.length - 1] - a[0] ) / ( Math.log2(a.length) + 1);
    };

    let _hist_bin_auto = function(a) {
        const bin_width_fd = _hist_bin_fd(a),
              bin_width_sturges = _hist_bin_sturges(a);
            
        return bin_width_fd ? Math.min(bin_width_fd, bin_width_sturges) : bin_width_sturges;
    }

    let plot = function (data, container, margin) {
        data = Array.prototype.map.call(data, Number).sort(d3.ascending);

        margin = {
            left: 5,
            right: 5,
            top: 10,
            bottom: 10
        };

        const width  = 600,
              height = 400;
        
        const n_bins = Math.ceil(( data[data.length - 1] - data[0] ) / _hist_bin_auto(data));

        let svg_container = d3.select(container instanceof jQuery ? container.get(0) : container)
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
            .attr('x', (d) => x_range(d.x0) + 1.5)
            .attr('y', (d) => y_range(d.length))
            .attr('width', (d) => Math.max(0, x_range(d.x1) - x_range(d.x0)))
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
        this.settings = settings;

        this.dt = settings.oInstance.api();
        this.data = this.dt.data();

        this.data_preview = null;
        this.dtype_preview = null;

        this.container = $(settings.nTHead);
    }

    DataPreview.prototype.create_row = function () {
        let row = $(this.dt.row(0).node())
            .clone()
            .removeClass();

        row
            .children()
            .empty()
            .removeAttr('aria-controls')
            .removeAttr('aria-label')
            .removeClass(); // remove all classes

        return row;
    };

    DataPreview.prototype.create_dtype_preview = function () {
        let dtype_preview = this.create_row();

        dtype_preview
            .attr('class', 'dtype-preview')
            .children('td')
            .addClass('dt-head-center')
            .addClass('column-dtype-preview');

        dtype_preview.children().each((i, elt) => {
            if ($(elt).is('th')) // skip indices
                return;

            const dtype_container = $('<div>')
                .attr('class', 'select');
            
            // dtype element
            const dtype = this.settings.aoColumns[i].sType;
            const dtype_select = $('<select>')
                .attr('role', 'option')
                .attr('class', 'dtype')
                .appendTo(dtype_container);

            const dtype_options = [
                $('<option>').attr('value', dtype).text(dtype)
                // TODO: other options suitable for this column
            ];

            dtype_options.forEach((opt) => opt.appendTo(dtype_select));

            $(elt)
                .attr('aria-label', `dtype preview for column ${i}`)
                .html(dtype_container);
        });

        dtype_preview.ready(() => {
            this.dtype_preview = dtype_preview;

            console.debug("dtype preview created.", this.dtype_preview);
        });

        return this;
    };

    DataPreview.prototype.create_data_preview = function () {
        let data_preview = this.create_row();

        data_preview
            .attr('class', 'data-preview')
            .children('td')
            .attr('role', 'figure')
            .addClass('column-data-preview');

        data_preview.children().each((i, elt) => {
            if ($(elt).is('th')) // skip indices
                return;

            const data = this.dt.column(i).data();
            $(elt)
                .attr('aria-label', `data preview for column ${i}`);

            plot(data, elt);
        });

        data_preview.ready(() => {
            this.data_preview = data_preview;

            console.debug("Data preview created.", this.data_preview);
        });

        return this;
    };

    DataPreview.prototype.create_preview = function() {
        // column dtype
        this.create_dtype_preview();
        // column histogram
        this.create_data_preview();

        return this;
    };

    DataPreview.prototype.draw = function () {
        return this.ready((elt) => {
            $(this.container)
                .append([this.dtype_preview, this.data_preview]);
        });
    };

    DataPreview.prototype.ready = function (f) {
        return $(this.data_preview).ready(f);
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
            
            let dt = $(table).DataTable(options).columns.adjust()
                .responsive.recalc()
                .columns.adjust();
            let btns = new $.fn.dataTable.Buttons(dt, {
                buttons: buttons
            });
            
            events.one('output_appended.OutputArea', () => {
                setTimeout(dt.columns.adjust, 50);
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