
var dataset = null; 
var csvFile1 = "../data/station1_data.csv";

function weatherVisualization(){
    this.dataset = [];
    this.width = 1000;
    this.height = 700;

    this.updateDataset = function(data){
        this.dataset = data;
    };

    this.getDataset = function(){
        return this.dataset;
    };

    this.svg = d3.select('body')
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height);

    this.tempGraph = new lineGraph(this.dataset);
    this.tempGraph.setPosition(300, 0);

};

function lineGraph(data){
    this.xPos = 0;
    this.yPos = 0;
    this.width = 700;
    this.height = 200;
    this.dataset = data;

    this.setPosition = function(x, y){
        this.xPos = x;
        this.yPos = y;

        // redraw graph
        this.drawGraph();
    };

    this.setYAxisValue = function(){
        return;
    };

    // Define the yScale
    this.yScale = d3.scale.linear()
    .domain([d3.min(this.dataset, function(d){
        return d.temp_air}
        ), 
        d3.max(this.dataset, function(d){
            return d.temp_air}
        )])
    .range([0, this.height]);

    // Define the xAxis
    this.yAxis = d3.svg.axis()
                    .scale(this.yScale)
                    .orient("left");

    this.drawGraph = function(){
        this.svg = d3.select('body svg');

        this.graph = this.svg.append('g')
        .attr('width',this.width)
        .attr('height',this.height)
        .attr('x', this.xPos)
        .attr('y', this.yPos);

        this.graph.append('g')
            .attr('class','axis')
            .call(this.yAxis);
    };

    // Draw graph
    //this.drawGraph();
};

d3.csv(csvFile1, function(d){
    dataset = d;

    var vis = new weatherVisualization();
    vis.updateDataset(dataset);

    console.log(vis.getDataset());


});