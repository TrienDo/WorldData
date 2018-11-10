//http://bl.ocks.org/feyderm/75c18a9143aac50a24e392762f10d6a4
// dims
var margin = { top: 20, right: 0, bottom: 50, left: 120 },
    svg_dx = 800, 
    svg_dy = 400,
    plot_dx = svg_dx - margin.right - margin.left,
    plot_dy = svg_dy - margin.top - margin.bottom;

// scales
var x = d3.scaleLinear().range([margin.left, plot_dx]),
    y = d3.scaleLinear().range([plot_dy, margin.top]);

var svg = d3.select("#chart")
            .append("svg")
            .attr("width", svg_dx)
            .attr("height", svg_dy);

var hulls = svg.append("g")
               .attr("id", "hulls");

var circles = svg.append("g")
                 .attr("id", "circles");

// synthetic data with 15 known Gaussian clusters
// ref: S2 dataset from  http://cs.joensuu.fi/sipu/datasets/
var clusters = d3.range(0, 15).map((n) => n.toString());

// costs for each iteration
var costs = [];

hulls.selectAll("path")
     .data(clusters)
     .enter()
     .append("path")
     .attr("class", "hull")
     .attr("id", d => "hull_" + d);

// data is 10% sample of original dataset 
d3.csv("s2_sample.csv", d => {             
    d.forEach(d =>  {
                        d.x = +d.x;
                        d.y = +d.y;
                    });

    setScaleDomains(d);
    plotCircles(d);

    // randomly select 15 data points for initial centroids
    var initialCentroids = clusters.map(() => d[Math.round(d3.randomUniform(0, d.length)())]);

    assignCluster(initialCentroids);
    addHull();

    costs.push(computeCost());

    var iterate = d3.interval(() => {
        var c = computeCentroids();
        assignCluster(c);
        addHull();
        var cost = computeCost();
        // stop iterating when algorithm coverges to local minimum
        if (cost == costs[costs.length - 1]) {
            displayStats(costs);
            iterate.stop();
        }
        costs.push(cost);
    },500);
});

function displayStats(costs) {
    var stats = svg.append("g").attr("id", "stats");

    var formatMin = d3.format(".4");

    var n_iters = stats.append("text")
                       .attr("x", 10)
                       .attr("y", 20);

    n_iters.append("tspan")
           .style("font-weight", "bold")
           .text("Num. Iterations: ");

    n_iters.append("tspan")
           .text(costs.length);

    var cost = stats.append("text")
                    .attr("x", 10)
                    .attr("y", 40);

    cost.append("tspan")
        .style("font-weight", "bold")
        .text("Local Minimum: ");

    cost.append("tspan")
        .text(formatMin(costs[costs.length - 1]));
}

function computeCentroids() {
    var centroids = clusters.map(cluster => {
        var d = d3.selectAll(".cluster_" + cluster).data(),
        n = d.length;
        var x_sum = d3.sum(d, d => d.x),
        y_sum = d3.sum(d, d => d.y);
        return { x:(x_sum / n), y:(y_sum / n) };
    });
    return centroids;
}

function addHull() {
    clusters.forEach(cluster => {
        // parse cluster data
        var d_cluster = d3.selectAll(".cluster_" + cluster)
                          .data()
                          .map((datum) => [x(datum.x), y(datum.y)]);
        // path given data points for cluster
        var d_path = d3.polygonHull(d_cluster);
        var color = d3.schemeCategory20[+cluster];
        // ref: https://bl.ocks.org/mbostock/4341699
        d3.select("#hull_" + cluster)
          .attr("id", "hull_" + cluster)
          .transition()
          .duration(250)
          .attr("d", d_path === null ? null : "M" + d_path.join("L") + "Z")
          .attr("fill", color)
          .style("stroke", color);
    });
}

function computeCost() {
    var dists = d3.selectAll("circle")
                  .data()
                  .map(d => d._dist);
    return d3.sum(dists);
}

function assignCluster(centroids) {
    d3.selectAll("circle")
      .each(function(d) {
          // distances of data point from all centroids
          var dists = computeDistances(centroids, d);
          // min. distance defines cluster number 
          var dist_min = d3.min(dists);
          var cluster_num = dists.findIndex(dist => dist == dist_min);
          var color = d3.schemeCategory20[cluster_num];
          // stash min. distance to compute cost
          d._dist = dist_min;
          // assign data point to cluster of minimum distance
          d3.select(this)
            .attr("fill", d3.color(color).brighter(0.5))
            .attr("class", "pt cluster_" + cluster_num);
      });
}

function computeDistances(centroids, d_pt) {
    var dists = centroids.map(centroid => {
        var dist = Math.sqrt(Math.pow(d_pt.x - centroid.x, 2) + Math.pow(d_pt.y - centroid.y, 2));
        return dist;
    });
    return dists;
}

function setScaleDomains(d) {
    x.domain(d3.extent(d, d => d.x));
    y.domain(d3.extent(d, d => d.y));
}

function plotCircles(d) {
    circles.selectAll("circle")
           .data(d)
           .enter()
           .append("circle")
           .attr("class", "pt")
           .attr("r", 5)
           .attr("cx", (d) => x(d.x))
           .attr("cy", (d) => y(d.y));
}