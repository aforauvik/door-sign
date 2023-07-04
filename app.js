let working = document.querySelector(".working-btn");
let video = document.querySelector(".video-btn");
let audio = document.querySelector(".audio-btn");
let recording = document.querySelector(".record-btn");

const message = document.querySelector(".display-h1");
const title = document.querySelector(".display-h2");
const signView = document.querySelector(".display");
const adminPanel = document.querySelector(".admin");
const copyright = document.querySelector(".bottom-title");

function adminPanelView() {
	signView.style.display = "none";
	adminPanel.style.display = "block";
	copyright.style.display = "flex";
}

function buttonStatusOn() {
	working.textContent = "Turn On";
	video.textContent = "Turn On";
	audio.textContent = "Turn On";
	recording.textContent = "Turn On";
}

function defaultMessage() {
	buttonStatusOn();
	title.textContent = "Doing nothing";
	message.textContent = "Enter at will";
	// message.style.width = "55%";
	signView.style.background = "#86C8BC";
}

function workingSign() {
	if (working.textContent === "Turn On") {
		title.textContent = "Busy";
		message.textContent = "Do not disturb please";
		// message.style.width = "345px";
		// working.textContent = "Turn Off";
		video.textContent = "Turn On";
		audio.textContent = "Turn On";
		recording.textContent = "Turn On";
		signView.style.background = "#252525";
		adminPanel.style.display = "none";
		copyright.style.display = "none";
		signView.style.display = "flex";
	} else {
		defaultMessage();
	}
}

function videoSign() {
	if (video.textContent === "Turn On") {
		title.textContent = "Quiet Please";
		message.textContent = "video meeting in progress";
		// message.style.width = "630px";
		// video.textContent = "Turn Off";
		working.textContent = "Turn On";
		audio.textContent = "Turn On";
		recording.textContent = "Turn On";
		signView.style.background = "#FF9494";
		adminPanel.style.display = "none";
		copyright.style.display = "none";
		signView.style.display = "flex";
	} else {
		defaultMessage();
	}
}

function audioSign() {
	if (audio.textContent === "Turn On") {
		title.textContent = "Quiet Please";
		message.textContent = "audio meeting in progress";
		// message.style.width = "650px";
		// audio.textContent = "Turn Off";
		working.textContent = "Turn On";
		video.textContent = "Turn On";
		recording.textContent = "Turn On";
		signView.style.background = "#FFC090";
		adminPanel.style.display = "none";
		copyright.style.display = "none";
		signView.style.display = "flex";
	} else {
		defaultMessage();
	}
}

function recordSign() {
	if (recording.textContent === "Turn On") {
		title.textContent = "Quiet Please";
		message.textContent = "recording in progress";
		// message.style.width = "525px";
		// recording.textContent = "Turn Off";
		working.textContent = "Turn On";
		video.textContent = "Turn On";
		audio.textContent = "Turn On";
		signView.style.background = "#FF7D7D";
		adminPanel.style.display = "none";
		copyright.style.display = "none";
		signView.style.display = "flex";
	} else {
		defaultMessage();
	}
}
