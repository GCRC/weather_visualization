
var dataset = null; 
var csvFile1 = "../data/station1_data.csv";

function weatherVisualization(){
    this.dataset = [];
    this.width = 1000;
    this.height = 700;

    this.updateDataset = function(data){
        this.dataset = data;
        this.drawVisualization();
    };

    this.getDataset = function(){
        return this.dataset;
    };

    this.drawVisualization = function(){

        // If svg already exists remove it before creating a new one
        if (!d3.select('body svg').empty() ){
            d3.select('svg').remove();

        };

        // Draw svg 
        this.svg = d3.select('body')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        // Add a graph to the svg
        this.tempGraph = new lineGraph(this.dataset);   
    };
};

// Line graph constructor
function lineGraph(data){
    var _this = this;
    this.dataset = data;

    // Define the xScale
    this.xScale = d3.scale.linear()
        .domain([d3.min(this.dataset, function(d){
            var timeHours = (parseInt(d.month) * 30 * 24) + (parseInt(d.day) * 24) + parseInt(d.hour);
            return timeHours;
        }), 
        d3.max(this.dataset, function(d){
            var timeHours = (parseInt(d.month) * 30 * 24) + (parseInt(d.day) * 24) + parseInt(d.hour);
            return timeHours;
        })])
        .range([0, this.width]);


    // Define the yScale
    this.yScale = d3.scale.linear()
        // .domain([d3.min(this.dataset, function(d){
        //     if (d.temp_air && parseInt(d.temp_air) !== -9999){
        //         return parseInt(d.temp_air);
        //     } else {
        //         return 0;
        //     };
        // }),
        // d3.max(this.dataset, function(d){
        //     return d.temp_air})])
        .domain([-50,50])
        .range([0, this.height]);

    // // Define the xAxis
    // this.yAxis = d3.svg.axis()
    //                 .scale(this.yScale)
    //                 .orient("left");

    this.drawGraph = function(){
        var _this = this;
        this.svg = d3.select('body svg');

        this.svg.selectAll("circle")
            .data(_this.dataset)
            .enter()
            .append("circle")
            .attr('r',2)
            .attr('cx',function(d){
                var timeHours = (parseInt(d.month) * 30 * 24) + (parseInt(d.day) * 24) + parseInt(d.hour);
                return _this.xScale(timeHours);
            })
            .attr('cy',function(d){
                var airTemp = (parseInt(d.temp_air) !== -9999)?parseInt(d.temp_air):0;
                return _this.yScale(airTemp);
            });

        // this.graph.append('g')
        //     .attr('class','axis')
        //     .call(this.yAxis);
    };

    // Draw graph
    this.drawGraph();
};

d3.csv(csvFile1, function(d){
    dataset = d;

    var vis = new weatherVisualization();
    vis.updateDataset(dataset);

    console.log(vis.getDataset());


});