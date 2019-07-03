define("graph-objects", ["chartjs", "d3"], function (chartjs, d3) {

    Chart.defaults.scale.gridLines.display = false


    let Bar = function (data, labels) {
        if (_.isUndefined(labels)) {
            labels = d3.range(0, data.length)
        }

        console.debug("Bar plot data: ", data, "labels: ", labels)

        let canvas = $("<canvas>")
            .attr("width", "135px")
            .css("margin", "auto")

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


    let CategoricalBar = function(data) {

        const grouped = d3.nest()
            .key( d => d)
            .rollup( d => d.length)
            .entries(data)
        
        const values = grouped.map( d => d.value) 
        const labels = grouped.map( d => d.key) 
        
        return Bar(values, labels)
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


    let Histogram = function (data) {
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

        return Bar(histogram_data, histogram_labels)
    }


    return {
        Bar: Bar,
        CategoricalBar: CategoricalBar,
        Histogram: Histogram
    }

})