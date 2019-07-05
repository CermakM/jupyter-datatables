define("graph-objects", ["moment", "chartjs", "d3"], function (moment, chartjs, d3) {

    Chart.defaults.scale.gridLines.display = false

    const layout = Chart.defaults.global.layout

    layout.width   = "150px"
    layout.margin  = "auto"
    layout.padding = 5


    let Bar = function (data, index, dtype) {

        if (_.isUndefined(index)) {
            index = {
                data : d3.range(0, data.length),
                dtype: 'num',
                level: 0
            }
        } else if ( index.length > 1 ) {
            console.warn("Multi-index is not supported yet. Picking the 0th level.")
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

        canvas.ready(() => {

            let ctx = canvas.get(0).getContext('2d');

            barChart = new Chart(ctx, {
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
        })

        return canvas
    }


    let CategoricalBar = function(data, index, dtype) {

        const grouped = d3.nest()
            .key( d => d)
            .rollup( d => d.length)
            .entries(data)
        
        const values = grouped.map( d => d.value) 
        const labels = grouped.map( d => d.key) 

        index = [{level: 0, data: labels, dtype: dtype}]
        
        return Bar(values, index, 'num')
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

        let bins = d3.histogram()
            .domain(xScale.domain())
            .thresholds(xScale.ticks(nBins))
            (data)

        const histogram_data = bins.map((d) => d.length)
        const histogram_labels = bins.map((d) => d.x0)

        index = [{level: 0, data: histogram_labels, dtype: dtype}]

        return Bar(histogram_data, index, 'num')
    }


    return {
        Bar: Bar,
        CategoricalBar: CategoricalBar,
        Histogram: Histogram
    }

})