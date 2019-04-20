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

    let histogram = function (data, margin) {
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
        
        let svg_container = document.createElement('div');
        let svg = d3.select(svg_container)
            .classed('svg-container', true)
            .append('svg')
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

        return svg_container;
    };

    let bar = function (data, margin) {
        margin = {
            left: 5,
            right: 5,
            top: 10,
            bottom: 10
        };

        const width  = 600,
              height = 400;

        let svg_container = document.createElement('div');
        let svg = d3.select(svg_container)
            .classed('svg-container', true)
            .append('svg')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .classed('svg-content', true);

        let g = svg
            .append('g')
            .classed('bars', true);

        let x_range = d3.scaleBand()
            .domain(data.map( (d) => d.key ))
            .range([0, width])
            .padding(0.1);

        let y_range = d3.scaleLinear()
            .domain([0, d3.max(data, (d) => d.value )])
            .nice()
            .range([height, 0]); // reverse the domain

        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', (d) => x_range(d.key))
            .attr('y', (d) => y_range(d.value))
            .attr('width', x_range.bandwidth())
            .attr('height', (d) => y_range(0) - y_range(d.value))
            .attr('fill', 'steelblue')
            .classed('bar', true);

        return svg_container;
    };

    const dtype_map = new Map();
    ['bool'].forEach((dtype) => dtype_map.set(dtype, 'bool'));  // bool
    ['object', 'string'].forEach(
        (dtype) => dtype_map.set(dtype, 'string')
    );  // string
    ['int8, int16, int32, int64', 'float8, float16, float32, float64'].forEach(
        (dtype) => dtype_map.set(dtype, 'num')
    );  // number
    ['datetime8[ns]', 'datetime16[ns]', 'datetime32[ns]', 'datetime64[ns]'].forEach(
        (dtype) => dtype_map.set(dtype, 'date')
    );  // date

    $.fn.dataTable.Api.register('row.create()', function () {
        let row = $(this.row(0).node())
            .clone()
            .removeClass()
        
        row
            .children()
            .empty();
        
        return row;
    });

    let create_dtype_preview = function (dtype) {
        const dtype_container = $('<div>')
            .attr('class', 'dtype-container');

        // dtype element
        const dtype_select = $('<select>')
            .attr('role', 'option')
            .attr('class', 'dtype')
            .appendTo(dtype_container);

        const dtype_options = [
            $('<option>').attr('value', dtype).text(dtype)
            // TODO: other options suitable for this column
        ];

        dtype_options.forEach((opt) => opt.appendTo(dtype_select));
        
        return dtype_container;
    };

    let create_data_preview = function (data, dtype) {
        let data_preview = null;
        switch(dtype.toLowerCase()) {
            case 'num':
                data_preview = histogram(data);
                break;
            case 'string':
                const grouped = d3.nest()
                    .key( (d) => d )
                    .rollup( (d) => d.length)
                    .entries(data);
                
                data_preview = bar(grouped);
                break;
            default:
                data_preview = bar(data);
        }
                
        return data_preview;
    };


    /**
     * Boolean type detector
     */
    $.fn.dataTable.ext.type.detect.unshift(function (data) {
        const dtype = 'boolean';

        if (_.isBoolean(data)) {
            return dtype;
        }
        else if (_.isString(data)) {
            return (/true|false/i).test(data.toLowerCase()) ? dtype : null;
        }

        return null;
    });


    let create_datatable = function (table, options, buttons) {
        return new Promise((resolve) => {
            Object.assign(options, {
                fnInitComplete: function (settings) {
                    let dt = settings.oInstance.api();

                    console.debug('dtype preview initialization.', settings);
                    
                    let dtype_preview_row = dt.row.create()
                        .removeAttr('aria-label')
                        .attr('class', 'dtype-preview');

                    dtype_preview_row
                        .children().each((i, e) => {
                            if ($(e).is('th'))
                                return;
                        
                            let dtype = settings.aoColumns[i].sType;
                            let dtype_preview = create_dtype_preview(dtype);

                            $(e)
                                .attr('class', 'column-dtype-preview dt-head-center')
                                .attr('aria-label', `dtype preview for column ${i}`)
                                .append(dtype_preview);

                            // map dtype back to known format
                            settings.columns(i).type = dtype_map.get(dtype) || null;
                        });
                    
                    dtype_preview_row.ready(() => {
                        $(settings.nTHead).append(dtype_preview_row);
                    });
                    
                    console.debug('Data preview initialization.', settings);
                    
                    let data_preview_row = dt.row.create()
                        .removeAttr('aria-controls')
                        .removeAttr('aria-label')
                        .attr('class', 'column-data-preview');

                    data_preview_row
                        .children().each((i, e) => {
                            if ($(e).is('th')) return;
                        
                            $(e)
                            .attr('class', 'column-data-preview')
                            .attr('role', 'figure')
                            .attr('aria-label', `data preview for column ${i}`);

                            let dtype = settings.aoColumns[i].sType;
                            let data  =  dt.column(i).data();
                            let data_preview = create_data_preview(data, dtype);
                        
                            $(e).append(data_preview);
                        });
                    
                    data_preview_row.ready(() => {
                        $(settings.nTHead).append(data_preview_row);
                    });
                    
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