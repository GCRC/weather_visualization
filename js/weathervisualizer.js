/* 
 * Name: weathervisualizer.js
 * ------------------------------------------------------------------------------
 * Description: d3js weather data visualization. Display's historical weather 
 * data on air temp, barometric pressure and wind speed from three weather stations 
 * near Clyde River, Nunavut.
 * ------------------------------------------------------------------------------
 */

;(function($,$n2,$d){
    //"use strict";
    
    // Localization
    var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
    
    var DH = 'WeatherDataVisualizer'; 
    
    //--------------------------------------------------------------------------
    var WeatherDataVisualizer = $n2.Class('WeatherDataVisualizer', {
        
        containerId: null,
        dataset: null,
        csvFiles: null,
        dispatchService: null,
        width: null,
        height: null,
        svgPadding: 10,
        
        initialize: function(opts_){
    
            var opts = $n2.extend({
                containerId: null
                ,config: null
                ,options: null
                ,widgetOptions: null
            },opts_);
            
            var _this = this;

            if (opts.config) {
                if (opts.config.directory) {
                    this.dispatchService = opts.config.directory.dispatchService;
                };
            };

            if (this.dispatchService) {
             
                // Register with dispatch service
                var f = function(m, addr, dispatcher){
                    _this._handle(m, addr, dispatcher);
                };
    
                this.dispatchService.register(DH, 'windowResized', f);
            };


            if( opts.widgetOptions ){ 
                this.containerId = "#" + opts.widgetOptions.containerId;
                this.csvFiles = opts.widgetOptions.csvFiles;
            };
            
            if( this.containerId ){
                // if containerId defined, than calculate svg width and height values
                this._getWindowHeight();
                this._getWindowWidth();
            }
            else {
                throw new Error('containerId must be specified');
            }; 

            if( !this.csvFiles ){
                throw new Error('weather station CSV data not specified')
            } else {
                if( !this.dataset ){
                    // initiate visualization dataset with first supplied csv file
                    this._loadCSVDataset(this.csvFiles[0]);
                }; 
            };
            
            //this._drawVisualization();
            
            $n2.log("Clyde River Weather Station Data Visualizer: ", this);
        },

        _getWindowWidth: function(){
            // Acquire width value for the container element
            var $containerWidth = $(this.containerId).width();
            var svgPadding = this.svgPadding * 2;

            this.width = $containerWidth - svgPadding;
        },

        _getWindowHeight: function(){
            // Acquire height value for the container element
            var $containerHeight = $(this.containerId).height();
            var svgPadding = this.svgPadding * 2;

            this.height = $containerHeight - svgPadding;
        },

        _updateDataset: function(data){
            this.dataset = data;
            this._drawVisualization();
        },

        _convertDates: function(data){

            // Loop through all filtered data and add date objects based on temporal coloumn data
            for( var i = 0, e = data.length; i < e; i++ ){

                var row = data[i];
                var year = row.year;
                var month = row.month -1; // month range = 0 - 11 
                var day = row.day;
                var hour = row.hour;

                // Add new date property to row containing new date object
                row.date = new Date(year, month, day, hour);
            };
            return data;
        },

        _loadCSVDataset: function(csvFile){
            var _this = this;

            $d.csv(csvFile, function(d){

                // filter out all rows with null air temperture, wind speed and barometric pressure values from the dataset
                var dataset = d.filter(function(d) {
                    var nullValue = "-9999";
                    if( d.temp_air !== nullValue && d.pressure !== nullValue && d.wind_speed !== nullValue ){
                        return d;
                    };
                });

                dataset = _this._convertDates(dataset);

                _this._updateDataset(dataset);
            });
        },
        
        // Draw Weather Visualization
        _drawVisualization: function(){

            // If svg already exists remove it before creating a new one
            if (!$d.select(this.containerId + ' svg').empty() ){
                $d.select('svg').remove();
            };
    
            // Draw svg 
            var svg = $d.select(this.containerId)
                .append('svg')
                    .attr('width', this.width)
                    .attr('height', this.height)
                    .attr("transform", "translate(" + this.svgPadding + "," + this.svgPadding + ")");
    
            var lineGraphTopMargin = 50;
            var lineGraphLeftMargin = 400;
            
            var airTempGraphProperties = {
                dataset: this.dataset,
                dependentVar: "temp_air",
                dependentLabel: "Air Temperature °C",
                dispatchService: this.dispatchService,
                width: this.width - lineGraphLeftMargin,
                height: ((this.height - lineGraphTopMargin)/3),
                leftMargin: lineGraphLeftMargin,
                topMargin: lineGraphTopMargin
            };

            var windSpeedGraphProperties = {
                dataset: this.dataset,
                dependentVar: "wind_speed",
                dependentLabel: "Wind Speed km/hr",
                dispatchService: this.dispatchService,
                width: this.width - lineGraphLeftMargin,
                height: ((this.height - lineGraphTopMargin)/3),
                leftMargin: lineGraphLeftMargin,
                topMargin: lineGraphTopMargin + this.height/3
            };

            var pressureGraphProperties = {
                dataset: this.dataset,
                dependentVar: "pressure",
                dependentLabel: "Pressure kPa",
                dispatchService: this.dispatchService,
                width: this.width - lineGraphLeftMargin,
                height: ((this.height - lineGraphTopMargin)/3),
                leftMargin: lineGraphLeftMargin,
                topMargin: lineGraphTopMargin + ((this.height/3)*2)
            };
    
            // Add line graphs to the svg
            this.tempGraph = new WeatherDataVisualizerLineGraph(airTempGraphProperties);
            this.windSpeedGraph = new WeatherDataVisualizerLineGraph(windSpeedGraphProperties);
            this.pressureGraph = new WeatherDataVisualizerLineGraph(pressureGraphProperties);
        },

        _handle: function(m){
            if( 'windowResized' === m.type ){
                // Update svg width and height
                this._getWindowHeight(m);
                this._getWindowWidth(m);

                // Re-draw visualization
                this._drawVisualization();
            };
        }   
    });

    //--------------------------------------------------------------------------
    var WeatherDataVisualizerLineGraph = $n2.Class('WeatherDataVisualizerLineGraph', {

        dataset: null,
        dependentVar: null,
        dependentLabel: null,
        leftMargin: null,
        topMargin: null,
        padding: {top: 0, right: 0, bottom: 100, left: 60},
        height: null,
        width: null,
        xScale: null,
        yScale: null, 
        xAxis: null,
        yAxis: null,
	    dispatchService: null,
        
        initialize: function(opts_){
    
            var opts = $n2.extend({
                dataset: null
                ,leftMargin: null
                ,topMargin: null
                ,dispatchService: null
            },opts_);
            
            var _this = this;            
            this.height = opts.height - this.padding.top - this.padding.bottom;
            this.width = opts.width - this.padding.left - this.padding.right;
            
            if( opts.dispatchService ){
                this.dispatchService = opts.dispatchService;
            } else {
                throw new Error('dispatchService not defined in line graph');
            };

            if( opts.dataset ){ 
                this.dataset = opts.dataset;
            } else {
                throw new Error('Dataset not provided for line graph');
            };

            if( opts.dependentVar ){ 
                this.dependentVar = opts.dependentVar;
            } else {
                throw new Error('Dependednt variable not provided for line graph');
            };

            if( opts.dependentLabel ){ 
                this.dependentLabel = opts.dependentLabel;
            } else {
                throw new Error('Dependednt variable not provided for line graph');
            };

            if( opts.leftMargin ){ 
                this.leftMargin = opts.leftMargin;
            } else {
                throw new Error('Left margin not provided for line graph');
            };

            if( opts.topMargin ){ 
                this.topMargin = opts.topMargin;
            } else {
                throw new Error('Top margin not provided for line graph');
            };

            // Define Scales
            this.xScale = this._defineXScale();
            this.yScale = this._defineYScale();

            // Define the Axis
            this.xAxis = this._defineXAxis();
            this.yAxis = this._defineYAxis();
    
            // Draw graph
            this._drawLineGraph();
        },

        _defineXScale: function(){
            var xScale = $d.time.scale()
                .domain([ this.dataset[0].date, this.dataset[this.dataset.length - 1].date])
                .range([this.padding.left, this.width]);

            return xScale;
        },

        _defineYScale: function(){
            var _this = this;

            var yScale = $d.scale.linear()
                .domain([$d.max(this.dataset, function(d){
                    return parseInt(d[_this.dependentVar])}),
                    $d.min(this.dataset, function(d){
                    return parseInt(d[_this.dependentVar])})
                ])
                .range([this.padding.top, this.height]);

            return yScale;
        },

        _defineXAxis: function(){
            var xAxis = $d.svg.axis()
                .scale(this.xScale)
                .ticks(6)
                .tickFormat(d3.time.format("%y/%m/%d"))
                .orient("bottom");
            
            return xAxis;
        },

        _defineYAxis: function(){
            var yAxis = $d.svg.axis()
                .scale(this.yScale)
                .ticks(5)
                .orient("left");

            return yAxis;
        },

        _drawLineGraph: function(){
            var _this = this;
            var svg = $d.select('#content svg');
    
            var line = $d.svg.line()
                .x(function(d) { 
                    return _this.xScale(d.date); 
                })
                .y(function(d) { 
                    return _this.yScale(parseInt(d[_this.dependentVar])); 
                });

            var lineGraph = svg.append("g")
                .attr("class", _this.dependentVar + "_graph");
            
            // Add path of line graph
            lineGraph.append("path")
                .datum(_this.dataset)
                .attr("class", "line")
                .attr("transform", "translate(" + _this.leftMargin + "," + _this.topMargin + ")")
                .attr("d", line);
    
            // Add y axis to graph
            var yAxis = lineGraph.append("g")
                .attr("class", _this.dependentVar + "_axis axis")
                .attr("transform", "translate(" + parseInt(_this.padding.left + _this.leftMargin) + "," + _this.topMargin + ")")
                .call(this.yAxis)

            // Added yAxis Label
            yAxis.append("text")
                .text(_this.dependentLabel)
                .attr("class","axis_label")
                .attr("x",0-(_this.height/2))
                .attr("y",-40)
                .attr("transform", "rotate(270)");

            // Add x axis to graph
            var xAxis = lineGraph.append("g")
                .attr("class", _this.dependentVar + "_axis axis")
                .attr("transform", "translate(" + _this.leftMargin + "," + parseInt(_this.topMargin + _this.height) + ")")
                .call(this.xAxis);

            // Added xAxis label
            xAxis.append("text")
                .text("Date (YY/MM/DD)")
                .attr("class","axis_label")
                .attr("x",_this.width/2)
                .attr("y",40);
        }
    });
    
    $n2.weather_data_visualizer_widget = {
        WeatherDataVisualizer:WeatherDataVisualizer
    };
    
})(jQuery,nunaliit2,d3);
