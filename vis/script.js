var width = window.innerWidth,
    height = window.innerHeight;

var force = d3.layout.force()
    .size([width, height])
    .nodes([{}])
    .linkStrength(.5)
    .linkDistance(100)
    .charge(-1000)
    .on("tick", tick);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)

svg.append("rect")
    .attr("width", width)
    .attr("height", height);

var nodes = force.nodes(),
    links = force.links(),
    node_names = {},
    link_names = {},
    node = svg.selectAll(".node"),
    link = svg.selectAll(".link");

var texts = svg.selectAll("text.label");

var min = 0,
    max = 0;

var colors = d3.scale.category10();
update();

d3.json('output.json', function (error, json) {
    var i = 0;
    window.id = window.setInterval(function () {
        var d = json[i];
        if(d.changed){
            if (d.current_char in node_names == false) {
                var node = { name: d.current_char, lines: 5, sentiment: d.sentiment },
                    n = nodes.push(node);
                node_names[d.current_char] = node;
            } else {
                node_names[d.current_char].lines += 0.1;
            }
            if([d.current_char, d.last_char] in link_names == false) {
                if (d.last_char != null) {
                    if (d.last_char in node_names) {
                        links.push({source: node_names[d.current_char], target: node_names[d.last_char]});
                        if (node_names[d.last_char].sentiment != undefined) {
                            node_names[d.last_char].sentiment += d.sentiment;
                        } else {
                             node_names[d.last_char].sentiment = d.sentiment;
                        }
                        if (node_names[d.last_char].sentiment > max) {
                            max = node_names[d.last_char].sentiment;
                        };
                        if(node_names[d.last_char].sentiment < min) {
                            min = node_names[d.last_char].sentiment;
                        }
                    }
                }
            }
        }
        i++;
        update();
    }, 1);
});

function tick() {
    link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function (d) { return d.lines })
      .attr("style", function(d) {
            var scale = d3.scale.linear()
                .range([0, 255])
                .domain([min, max]);
            var sent = scale(d.sentiment),
                g = Math.floor(sent),
                r = Math.floor(255 - sent);
            if (d.name == 'hamlet') {
                //console.log("rgb(" + r+", "+g+",0)");
            };
            return("fill:rgb(" + r+", "+g+",0)");
        });

    texts.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
    })
    .text(function (d) {  return d.name + d.sentiment;  });
}

function update() {
    link = link.data(links);

    link.enter().insert("line", ".node")
        .attr("class", "link");

    node = node.data(nodes);

    texts = texts.data(force.nodes());
        

    node.enter().insert("circle", ".cursor")
        .attr("class", "node")
        .attr("r", function (d) { return d.lines; })
        .style("fill", function(d) {
            var scale = d3.scale.linear()
                .range([0, 255])
                .domain([min, max]);
            var sent = scale(d.sentiment),
                r = sent,
                g = 255 - sent;

            return("rgb(" + r+", "+g+",0)");
        })
        .call(force.drag);

    texts.enter().append("text")
        .attr("class", "label")
        .attr("fill", "black")
        .text(function (d) {  return d.name + d.sentiment;  });


    force.start();
}