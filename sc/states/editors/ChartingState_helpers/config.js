const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const cols = 8;
const colWidth = canvas.width / cols;
const rowHeight = 40;

let notes = []; 
let sectionData = [];
let songTitle = "untitled";
let selectedNote = null;

const laneColors = ["#C24B99","#00FFFF","#12FA05","#F9393F","#C24B99","#00FFFF","#12FA05","#F9393F"];

let inst = new Audio();
let voices = new Audio();
let playing = false;
let startTime = 0;
let hitSound = new Audio("hitsound.ogg");

let scrollSection = 0;
let sectionLength = 16;
let scrollOffset = 0;
let hoverCol = -1;
let hoverRow = -1;
let snapSteps = 16;

const noteTypeToNumber = {
  "": 0,
  "Alt Animation": 1,
  "Hey!": 2,
  "Hurt Note": 3,
  "GF Sing": 4,
  "No Animation": 5
};
