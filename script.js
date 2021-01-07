var selectedmove;
var sselect1;
var sselect2;
var circleList = [];
var xmousepos;
var ymousepos;
var CircleID = 0;
var edgecount = 0;
var componentcount = 0;
var isgraphipartite = true;
var hitOptions = {
  stroke: true,
  fill: true,
  tolerance: 1,
};

var vertexcounttext = new PointText({
  point: new Point(0, 30),
  content: "Number of nodes: 0",
  fillColor: "black",
  fontFamily: "Courier New",
  fontWeight: "bold",
  fontSize: 15,
  locked: true,
  justification: "left",
});

var edgecounttext = new PointText({
  point: new Point(0, 50),
  content: "Number of edges: 0",
  fillColor: "black",
  fontFamily: "Courier New",
  fontWeight: "bold",
  fontSize: 15,
  locked: true,
  justification: "left",
});

var componentcounttext = new PointText({
  point: new Point(0, 70),
  content: "Number of components: 0",
  fillColor: "black",
  fontFamily: "Courier New",
  fontWeight: "bold",
  fontSize: 15,
  locked: true,
  justification: "left",
});

var isbipartitetext = new PointText({
  point: new Point(0, 90),
  content: "Is bipartite: No",
  fillColor: "black",
  fontFamily: "Courier New",
  fontWeight: "bold",
  fontSize: 15,
  locked: true,
  justification: "left",
});

function onMouseDown(event) {
  var hitResult = project.hitTestAll(event.point, hitOptions);

  if (hitResult.length && hitResult[0].item.type == "circle") {
    selectedmove = hitResult[0].item;
  }
}

function onMouseDrag(event) {
  if (selectedmove != null) {
    selectedmove.position.x = event.point.x;
    selectedmove.position.y = event.point.y;
    selectedmove.degree.position.x = event.point.x;
    selectedmove.degree.position.y = event.point.y;

    updateEdge();
  }
}

function onMouseUp(event) {
  selectedmove = null;
}

function updateEdge() {
  if (!selectedmove.edges.length) {
    return;
  }

  for (var i = 0; i < selectedmove.edges.length; i++) {
    var circletwo = selectedmove.edges[i].referenceCircle; //get circle connected to selected circle

    if (circletwo == selectedmove) {
      deleteDrawnEdgesList(selectedmove.edges[i].drawnedge);
      selectedmove.edges[i].drawnedge = [];

      //Redraw edge list for both circles
      for (var j = 0; j < selectedmove.edges[i].numberofedges; j++) {
        var myPath = new Path.Arc({
          from: [selectedmove.position.x, selectedmove.position.y],
          through: [selectedmove.position.x, selectedmove.position.y - 50 - 10 * j],
          to: [selectedmove.position.x - 20, selectedmove.position.y - 20],
          strokeColor: "black",
          locked: false,
          start: selectedmove,
          end: circletwo,
        });

        project.activeLayer.insertChild(0, myPath); //insert at start of layer so draws "under" circle

        //Add path to the lists they share with the right indexes
        selectedmove.edges[i].drawnedge.push(myPath);
      }

      continue;
    }

    var k = 0;

    //Delete edge list from both circles
    for (; k < circletwo.edges.length; k++) {
      if (circletwo.edges[k].referenceID == selectedmove.myID) {
        deleteDrawnEdgesList[circletwo.edges[k].drawnedge];
        deleteDrawnEdgesList(selectedmove.edges[i].drawnedge);
        selectedmove.edges[i].drawnedge = [];
        circletwo.edges[k].drawnedge = [];
        break;
      }
    }

    //Redraw edge list for both circles
    for (var j = 0; j < selectedmove.edges[i].numberofedges; j++) {
      var myPath = new Path.Arc({
        from: [selectedmove.position.x, selectedmove.position.y],
        through: [
          (selectedmove.position.x + circletwo.position.x) / 2 + 10 * j,
          (selectedmove.position.y + circletwo.position.y) / 2 + 10 * j,
        ],
        to: [circletwo.position.x, circletwo.position.y],
        strokeColor: "black",
        locked: false,
        start: selectedmove,
        end: circletwo,
      });

      project.activeLayer.insertChild(0, myPath); //insert at start of layer so draws "under" circle

      //Add path to the lists they share with the right indexes
      selectedmove.edges[i].drawnedge.push(myPath);
      circletwo.edges[k].drawnedge.push(myPath);
    }
  }
}

function deleteDrawnEdgesList(list) {
  for (var i = 0; i < list.length; i++) {
    list[i].remove();
  }
}

function createEdge() {
  var offset = 0;
  var firstedge = true;
  var i = 0;
  var j = 0;

  //Loops
  if (sselect2 == sselect1) {
    for (var i = 0; i < sselect1.edges.length; i++) {
      if (sselect1.edges[i].referenceID == sselect1.myID) {
        offset = sselect1.edges[i].numberofedges;
      }
    }

    var myPath = new Path.Arc({
      from: [sselect1.position.x, sselect1.position.y],
      through: [sselect1.position.x, sselect1.position.y - 50 - 10 * offset],
      to: [sselect1.position.x - 20, sselect1.position.y - 20],
      strokeColor: "black",
      locked: false,
      start: sselect1,
      end: sselect2,
    });

    project.activeLayer.insertChild(0, myPath); //insert at start of layer so draws "under" circle

    for (var i = 0; i < sselect1.edges.length; i++) {
      if (sselect1.edges[i].referenceID == sselect1.myID) {
        sselect1.edges[i].numberofedges++;
        sselect1.edges[i].drawnedge.push(myPath);
        return;
      }
    }

    sselect1.edges.push({
      referenceID: sselect2.myID,
      numberofedges: 1,
      drawnedge: [myPath],
      referenceCircle: sselect2,
    });

    return;
  }

  //Update sselect1 and get index for sselect1
  for (; i < sselect1.edges.length; i++) {
    if (sselect2.myID == sselect1.edges[i].referenceID) {
      //Check if edgeslist already has sselect2 data in it's edge list
      offset = sselect1.edges[i].numberofedges; //Offset for arc of edge drawinig
      firstedge = false;

      //Update first circle
      sselect1.edges[i].numberofedges++;
      break;
    }
  }

  //Update sselect2 and get index for sselect2
  for (; j < sselect2.edges.length; j++) {
    if (sselect1.myID == sselect2.edges[j].referenceID) {
      //Check if edgeslist already has sselect2 data in it's edge list
      firstedge = false;

      //Update first circle
      sselect2.edges[j].numberofedges++;
      break;
    }
  }

  var myPath = new Path.Arc({
    from: [sselect1.position.x, sselect1.position.y],
    through: [
      (sselect1.position.x + sselect2.position.x) / 2 + 10 * offset,
      (sselect1.position.y + sselect2.position.y) / 2 + 10 * offset,
    ],
    to: [sselect2.position.x, sselect2.position.y],
    strokeColor: "black",
    locked: false,
    start: sselect1,
    end: sselect2,
  });

  project.activeLayer.insertChild(0, myPath); //insert at start of layer so draws "under" circle

  //Save node information
  if (firstedge) {
    sselect1.edges.push({
      referenceID: sselect2.myID,
      numberofedges: 1,
      drawnedge: [],
      referenceCircle: sselect2,
    });
    sselect2.edges.push({
      referenceID: sselect1.myID,
      numberofedges: 1,
      drawnedge: [],
      referenceCircle: sselect1,
    });
  }

  //Add path to the lists they share
  sselect2.edges[j].drawnedge.push(myPath);
  sselect1.edges[i].drawnedge.push(myPath);
}

function deleteEdge(edge) {
  var circleone = edge.start;
  var circletwo = edge.end;

  //Delete Loops
  if (circleone == circletwo) {
    circleone.numberofedges--;

    for (var i = 0; i < circleone.edges.length; i++) {
      if (circletwo.myID == circleone.edges[i].referenceID) {
        circleone.edges[i].numberofedges--;
        if (circleone.edges[i].numberofedges == 0) {
          circleone.edges.splice(i, 1);
        }
        break;
      }
    }

    edge.remove();
    return;
  }

  for (var i = 0; i < circleone.edges.length; i++) {
    if (circletwo.myID == circleone.edges[i].referenceID) {
      circleone.edges[i].numberofedges--;
      if (circleone.edges[i].numberofedges == 0) {
        circleone.edges.splice(i, 1);
      }
      break;
    }
  }

  for (var i = 0; i < circletwo.edges.length; i++) {
    if (circleone.myID == circletwo.edges[i].referenceID) {
      circletwo.edges[i].numberofedges--;
      if (circletwo.edges[i].numberofedges == 0) {
        circletwo.edges.splice(i, 1);
      }
      break;
    }
  }

  edge.remove();
}

function deleteCircle(circle) {
  circle.degree.remove(); //Delete degree text
  for (var i = 0; i < circle.edges.length; i++) {
    var circletwo = circle.edges[i].referenceCircle; //get circle connected to selected circle

    if (circletwo == circle) {
      deleteDrawnEdgesList(circle.edges[i].drawnedge);
      continue;
    }

    //Delete edge list from both circles
    for (var k = 0; k < circletwo.edges.length; k++) {
      if (circletwo.edges[k].referenceID == circle.myID) {
        deleteDrawnEdgesList[circletwo.edges[k].drawnedge];
        deleteDrawnEdgesList(circle.edges[i].drawnedge);
        circletwo.edges.splice(k, 1);
        break;
      }
    }
  }

  //Delete from global circle list
  for (var i = 0; i < circleList.length; i++) {
    if (circleList[i].myID == circle.myID) {
      circleList.splice(i, 1);
    }
  }
  circle.remove();

  if (sselect1 != null) {
    //Deselect and return normal colors
    sselect1.fillColor = sselect1.primarycolor;
    sselect1.strokeColor = sselect1.primarycolor;
  }

  sselect1 = null;
  sselect2 = null;
}

function getEdgeCount() {
  var count = 0;
  for (var i = 0; i < circleList.length; i++) {
    for (var j = 0; j < circleList[i].edges.length; j++) {
      //Double count if loop to avoid miss counting
      if (circleList[i].edges[j].referenceID == circleList[i].myID) {
        count += 2 * circleList[i].edges[j].numberofedges;
      } else {
        count += circleList[i].edges[j].numberofedges;
      }
    }
  }

  edgecount = count / 2;
  edgecounttext.content = "Number of edges: " + edgecount;
}

function getVertexCount() {
  vertexcounttext.content = "Number of nodes: " + circleList.length;
}

function getDegreeCount() {
  var count = 0;
  for (var i = 0; i < circleList.length; i++) {
    for (var j = 0; j < circleList[i].edges.length; j++) {
      count += 2 * circleList[i].edges[j].numberofedges;
    }
    circleList[i].edgecount = count / 2;
    circleList[i].degree.content = "Degree: " + count / 2;
    count = 0;
  }
}

function getComponentCount() {
  var visited = {};
  var queue = [];
  var colornodes = true;
  var startcircle = circleList[0];
  var completedsearch = false;
  var countcomp = 1;

  while (!completedsearch) {
    visited[startcircle.myID] = 0;

    for (var i = 0; i < startcircle.edges.length; i++) {
      if (!visited.hasOwnProperty(startcircle.edges[i].referenceID)) {
        queue.push(startcircle.edges[i].referenceCircle);
      }
    }

    if (queue.length == 0) {
      completedsearch = true;

      for (var i = 0; i < circleList.length; i++) {
        if (!visited.hasOwnProperty(circleList[i].myID)) {
          completedsearch = false;
          startcircle = circleList[i];
          countcomp++;
          break;
        }
      }
    } else {
      startcircle = queue.shift();
    }
  }

  componentcount = countcomp;

  componentcounttext.content = "Number of components: " + componentcount;
}

function isBipartite() {
  var visited = {};
  var queue = [];
  var colorlist = {};
  var completedsearch = false;
  var parentcolor = true;
  var startcircle = circleList[0];

  colorlist[startcircle.myID] = true;

  //Check if loops
  for (var i = 0; i < circleList.length; i++) {
    for (var j = 0; j < circleList[i].edges.length; j++) {
      if (circleList[i].myID == circleList[i].edges[j].referenceID) {
        isbipartitetext.content = "Is bipartite: No";
        isgraphipartite = false;
        return;
      }
    }
  }

  //Check parallel edges
  for (var i = 0; i < circleList.length; i++) {
    for (var j = 0; j < circleList[i].edges.length; j++) {
      if (circleList[i].edges[j].numberofedges > 1) {
        isbipartitetext.content = "Is bipartite: No";
        isgraphipartite = false;
        return;
      }
    }
  }

  //Breadth first search through graph
  while (!completedsearch) {
    parentcolor = colorlist[startcircle.myID];
    visited[startcircle.myID] = 0;

    for (var i = 0; i < startcircle.edges.length; i++) {
      if (!visited.hasOwnProperty(startcircle.edges[i].referenceID)) {
        queue.push(startcircle.edges[i].referenceCircle);
        colorlist[startcircle.edges[i].referenceID] = !parentcolor;
      }
    }

    if (queue.length == 0) {
      completedsearch = true;

      for (var i = 0; i < circleList.length; i++) {
        if (!visited.hasOwnProperty(circleList[i].myID)) {
          completedsearch = false;
          startcircle = circleList[i];
          colorlist[startcircle.myID] = true;
          break;
        }
      }
    } else {
      startcircle = queue.shift();
    }
  }

  completedsearch = false;
  visited = {};
  queue = [];
  startcircle = circleList[0];
  //Breadth first search through graph
  while (!completedsearch) {
    visited[startcircle.myID] = 0;
    for (var i = 0; i < startcircle.edges.length; i++) {
      if (!visited.hasOwnProperty(startcircle.edges[i].referenceID)) {
        queue.push(startcircle.edges[i].referenceCircle);

        if (colorlist[startcircle.edges[i].referenceID] == colorlist[startcircle.myID]) {
          isbipartitetext.content = "Is bipartite: No";
          isgraphipartite = false;
          return;
        }
      }
    }

    if (queue.length == 0) {
      completedsearch = true;

      for (var i = 0; i < circleList.length; i++) {
        if (!visited.hasOwnProperty(circleList[i].myID)) {
          completedsearch = false;
          startcircle = circleList[i];
          break;
        }
      }
    } else {
      startcircle = queue.shift();
    }
  }

  isbipartitetext.content = "Is bipartite: Yes";
  isgraphipartite = true;
}

function colorBipartite() {
  var visited = {};
  var queue = [];
  var colorlist = {};
  var startcircle = circleList[0];
  var completedsearch = false;

  startcircle.primarycolor = "red";
  startcircle.fillColor = "red";
  startcircle.strokeColor = "red";
  console.log("asdf");
  while (!completedsearch) {
    visited[startcircle.myID] = 0;

    for (var i = 0; i < startcircle.edges.length; i++) {
      if (!visited.hasOwnProperty(startcircle.edges[i].referenceID)) {
        queue.push(startcircle.edges[i].referenceCircle);

        if (startcircle.primarycolor == "blue") {
          startcircle.edges[i].referenceCircle.primarycolor = "red";
          startcircle.edges[i].referenceCircle.fillColor = "red";
          startcircle.edges[i].referenceCircle.strokeColor = "red";
        } else {
          startcircle.edges[i].referenceCircle.primarycolor = "blue";
          startcircle.edges[i].referenceCircle.fillColor = "blue";
          startcircle.edges[i].referenceCircle.strokeColor = "blue";
        }
      }
    }

    if (queue.length == 0) {
      completedsearch = true;

      for (var i = 0; i < circleList.length; i++) {
        if (!visited.hasOwnProperty(circleList[i].myID)) {
          completedsearch = false;
          startcircle = circleList[i];
          break;
        }
      }
    } else {
      startcircle = queue.shift();
    }
  }
}

function onKeyDown(event) {
  npoint = new Point(xmousepos, ymousepos);

  if (Key.isDown("n")) {
    var text = new PointText({
      point: npoint,
      content: "Degree: 0",
      fillColor: "black",
      fontFamily: "Courier New",
      fontWeight: "bold",
      fontSize: 8,
      locked: true,
      justification: "center",
    });

    var newcircle = new Path.Circle({
      center: npoint,
      radius: 30,
      strokeColor: "red",
      fillColor: "red",
      primarycolor: "red",
      secondarycolor: "black",
      type: "circle",
      myID: CircleID,
      edges: [],
      edgecount: 0,
      degree: text,
    });

    newcircle.insertBelow(text); //Insert text above circle layer
    circleList.push(newcircle);

    circleList;
    CircleID++;
  }

  if (Key.isDown("s")) {
    var hitResult = project.hitTestAll(npoint, hitOptions);

    if (hitResult.length) {
      if (sselect1 == null && hitResult[0].item.type == "circle") {
        sselect1 = hitResult[0].item;
        sselect1.fillColor = sselect1.secondarycolor;
        sselect1.strokeColor = sselect1.secondarycolor;
      } else {
        if (hitResult[0].item.type == "circle") {
          sselect2 = hitResult[0].item;

          createEdge();

          //Deselect and return normal colors
          sselect1.fillColor = sselect1.primarycolor;
          sselect1.strokeColor = sselect1.primarycolor;
          sselect1 = null;
          sselect2 = null;
        } else {
          sselect1 = null;
          sselect2 = null;
        }
      }
    } else {
      //Deselect and return normal colors
      if (sselect1 != null) {
        sselect1.fillColor = sselect1.primarycolor;
        sselect1.strokeColor = sselect1.primarycolor;
        sselect1 = null;
        sselect2 = null;
      }
    }
  }

  if (Key.isDown("d")) {
    var hitResult = project.hitTestAll(npoint, hitOptions);
    if (hitResult.length) {
      if (hitResult[0].item.type == "circle") {
        deleteCircle(hitResult[0].item);
      } else {
        deleteEdge(hitResult[0].item);
      }
    }
  }

  //Turn circle red
  if (Key.isDown("r")) {
    var hitResult = project.hitTestAll(npoint, hitOptions);
    if (hitResult.length) {
      if (hitResult[0].item.type == "circle") {
        hitResult[0].item.primarycolor = "red";
        hitResult[0].item.fillColor = hitResult[0].item.primarycolor;
        hitResult[0].item.strokeColor = hitResult[0].item.primarycolor;
      }
    }
  }

  //Turn circle blue
  if (Key.isDown("b")) {
    var hitResult = project.hitTestAll(npoint, hitOptions);
    if (hitResult.length) {
      if (hitResult[0].item.type == "circle") {
        hitResult[0].item.primarycolor = "blue";
        hitResult[0].item.fillColor = hitResult[0].item.primarycolor;
        hitResult[0].item.strokeColor = hitResult[0].item.primarycolor;
      }
    }
  }

  //Turn circle green
  if (Key.isDown("g")) {
    var hitResult = project.hitTestAll(npoint, hitOptions);
    if (hitResult.length) {
      if (hitResult[0].item.type == "circle") {
        hitResult[0].item.primarycolor = "green";
        hitResult[0].item.fillColor = hitResult[0].item.primarycolor;
        hitResult[0].item.strokeColor = hitResult[0].item.primarycolor;
      }
    }
  }

  if (Key.isDown("z")) {
    if (isgraphipartite) {
      colorBipartite();
    }
  }

  getEdgeCount();
  getVertexCount();
  getDegreeCount();

  if (circleList.length) {
    isBipartite();
    getComponentCount();
  }
}

function onMouseMove(event) {
  xmousepos = event.point.x;
  ymousepos = event.point.y;
}
