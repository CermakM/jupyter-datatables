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


    return {
        Bar: Bar,
        CategoricalBar: CategoricalBar
    }
})