define("graph-objects", ["moment", "chartjs"], function (moment, chartjs) {

    const d3 = Object.assign({}, require('d3'), require('d3-array'))  // extend the d3 with d3-array


    Chart.defaults.scale.gridLines.display = false

    const layout = Chart.defaults.global.layout

    layout.width   = "167.5px"
    layout.margin  = "auto"
    layout.padding = { left: 2, right: 2, top: 5, bottom: 5 }


    let Line = function (data, index, dtype) {

        if ( _.isUndefined(index) ) {
            index = [{
                data : d3.range(0, data.length),
                dtype: 'num',
                level: 0
            }]
        }

        index = index[0]  // TODO: Handle multi-index

        let labels = index.data

        if ( index.dtype === "date" ) {
            labels = labels.map( d => moment(d) )
        }

        console.debug("Line plot data: ", data, "labels: ", labels)

        let canvas = $("<canvas>")
            .attr("width", layout.width)
            .css("margin", layout.margin)

        let ctx = canvas.get(0).getContext('2d');

        let chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: 'rgb(255, 99, 132, 0.6)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }]
            },
            options: {
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        ...(index.dtype === 'date' ? {type: 'time'} : {}),
                        display: false
                    }],
                    yAxes: [{
                        display: false,
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
                responsive: false
            }
        });

        return chart
    }

    let Scatter = function (data, index, dtype) {

        if ( _.isUndefined(index) ) {
            index = [{
                data : d3.range(0, data.length),
                dtype: 'num',
                level: 0
            }]
        }

        index = index[0]  // TODO: Handle multi-index
    
        data = data.map( (d, i) => {
            return {
                x: index.data[i],
                y: d
            }
        })

        console.debug("Scatter plot data: ", data)

        let canvas = $("<canvas>")
            .attr("width", layout.width)
            .css("margin", layout.margin)
        
            let ctx = canvas.get(0).getContext('2d');

        let chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    data: data,
                    backgroundColor: 'rgb(255, 99, 132, 0.6)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }]
            },
            options: {
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        ...(index.dtype === 'date' ? { type: 'time' } : {}),
                        display: false
                    }],
                    yAxes: [{
                        display: false,
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
                responsive: false
            }
        });

        return chart
    }


    let Bar = function (data, index, dtype) {

        if ( _.isUndefined(index) ) {
            index = [{
                data : d3.range(0, data.length),
                dtype: 'num',
                level: 0
            }]
        }

        index = index[0]  // TODO: Handle multi-index

        let labels = index.data

        if ( index.dtype === "date" ) {
            labels = labels.map( d => $.fn.dataTable.defaults.formatDate(d) )
        }

        console.debug("Bar plot data: ", data, "labels: ", labels)

        let canvas = $("<canvas>")
            .attr("width", layout.width)
            .css("margin", layout.margin)


        let ctx = canvas.get(0).getContext('2d');

        let chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }]
            },
            options: {
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        ...(index.dtype === 'date' ? { type: 'time' } : {}),
                        display: false
                    }],
                    yAxes: [{
                        display: false,
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
                responsive: false
            }
        })

        return chart
    }


    let CategoricalBar = function(data, index, dtype) {

        const grouped = d3.nest()
            .key( d => d )
            .rollup( d => d.length )
            .entries(data)
        
        const values = grouped.map( d => d.value) 
        const labels = grouped.map( d => d.key) 

        index = [{level: 0, data: labels, dtype: dtype}]
        const chart = Bar(values, index, 'num')

        // point mapping
        chart.mapDataPoint = (p) => labels.indexOf(p.value)

        return chart
    }


    let histBinFreedman = function (a) {
        return 2 * (d3.quantile(a, 0.75) - d3.quantile(a, 0.25)) * Math.pow(a.length, -1 / 3)
    }

    let histBinSturges = function (a) {
        return (a[a.length - 1] - a[0]) / (Math.log2(a.length) + 1)
    }

    let histBinAuto = function (a) {
        const binWidthFreedman = histBinFreedman(a)
        const binWidthSturges = histBinSturges(a)

        return binWidthFreedman ? Math.min(binWidthFreedman, binWidthSturges) : binWidthSturges
    }


    let Histogram = function (data, index, dtype) {
        // map to the Number data type and sort
        data = Array.prototype.map.call(data, Number).sort(d3.ascending)

        console.debug("Histogram data: ", data)

        // automatically determine optimal number of bins
        const nBins = Math.ceil((data[data.length - 1] - data[0]) / histBinAuto(data))

        console.debug("Estimated number of bins: ", nBins)

        let xScale = d3.scaleLinear()
            .domain(d3.extent(data))
            .nice()

        let hist = d3.histogram()
            .domain(xScale.domain())
            .thresholds(xScale.ticks(nBins))

        let bins = hist(data)

        const histogram_data = bins.map((d) => d.length)
        const histogram_labels = bins.map((d) => d.x0)

        index = [{ level: 0, data: histogram_labels, dtype: dtype }]

        const chart = Bar(histogram_data, index, 'num')

        // point mapping
        chart.mapDataPoint = (p) => d3.maxIndex(hist([p.value]))

        return chart
    }


    return {
        Line: Line,
        Bar: Bar,
        CategoricalBar: CategoricalBar,
        Histogram: Histogram
    }

})