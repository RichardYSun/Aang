// 1. Install dependencies DONE
// 2. Import dependencies DONE
// 3. Setup webcam and canvas DONE
// 4. Define references to those DONE
// 5. Load posenet DONE
// 6. Detect function DONE
// 7. Drawing utilities from tensorflow DONE
// 8. Draw functions DONE

import React, { useRef } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./utilities";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  var poses = []; // stores 10 most recent poses - nose, eyes, ...
  const maxPoses = 10;

  var calibratedPose = Pose;
  var currPose = Pose;

  var calibrated = false;

  //  Load posenet
  const runPosenet = async () => {
    const net = await posenet.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.8,
    });
    //
    setInterval(() => {
      detect(net);
    }, 1000);
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;


      if (calibrated) {
        console.log(calibratedPose);
        drawCanvas(calibratedPose, video, videoWidth, videoHeight, canvasRef);
        return;
      }

      // Make Detections
      const pose = await net.estimateSinglePose(video);
      //console.log(pose);

      addPose(pose);

      drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);
    }
  };

  // replaces oldest pose with newest pose
  const addPose = (pose) => {
    if (poses.length >= maxPoses) {
      poses.shift();
    }

    poses.push(pose);

    if (!calibrated && poses.length == maxPoses) {
      calibratePose(0.6);
    }
  };

  const ergoComputation = () => {
    if (poses.length < maxPoses) {
      return;
    }

    //PostureChecker();
    //ArmChecker();
  };

  const calibratePose = (minConfidence) => {
    calibrated = true;
    // loops 17 times for 17 keypoints (body parts)
    for (var i = 0; i < poses[0]["keypoints"].length; i++) {
      // initialize component
      var poseComponent = PoseComponent;
      console.log(poses[0]["keypoints"][i]);
      poseComponent.part = poses[0]["keypoints"][i].part;

      var count = 0;

      for (var j = 0; j < maxPoses; j ++) {
        console.log("Pose" + j);//TODO Empty PoseCompnents
        console.log(poses[j]);
        if (poses[j]["keypoints"][i].score >= minConfidence) {
          // get sum for mean
          poseComponent.position.x += poses[j]["keypoints"][i].position.x;
          poseComponent.position.y += poses[j]["keypoints"][i].position.y;
          poseComponent.score += poses[j]["keypoints"][i].score;

          count ++;

          console.log(count);
        }
      }

      if (count == 0) {
        poseComponent.position.x = 0;
        poseComponent.position.y = 0;
        poseComponent.score = 0;
      } else {
        poseComponent.position.x /= count;
        poseComponent.position.y /= count;
        poseComponent.score /= count;
      }


      console.log(poseComponent);

      calibratedPose["keypoints"].push(poseComponent);
      currPose["keypoints"].push(poseComponent);
    }

    console.log("Calibrating done");
    console.log(calibratedPose);
  };

  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    drawKeypoints(pose["keypoints"], 0.6, ctx);
    drawSkeleton(pose["keypoints"], 0.7, ctx);
  };

  runPosenet();

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
      </header>
    </div>
  );
}

// point; a body part
const PoseComponent = {
  position: {
    x: 0,
    y: 0,
  },
  part: String,
  score: 0,
};

// a collection of PoseComponent points
const Pose = {
    "keypoints": [
      {
        "position": {
          "x": 0, 
          "y": 0
        },
        "part": String,
        "score": 0
      }
    ]
  };

export default App;
