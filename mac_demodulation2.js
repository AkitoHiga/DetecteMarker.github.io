const medias = {
  audio: false,
  video: {
    // width: {
    //   min: 1280,
    //   max: 1920,
    // },
    // height: {
    //   min: 720,
    //   max: 1080,
    // },  
    facingMode: {
      exact: "environment"
    }
  }
};
const video = document.getElementById("video");
video.autoplay = true;
video.muted = true;
video.playsInline = true;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const promise = navigator.mediaDevices.getUserMedia(medias);
const textArea = document.getElementById("textArea");

// import LSD from './lsd/lsd';

promise.then(successCallback)
       .catch(errorCallback);

function successCallback(stream) {
  video.srcObject = stream;
  const FPS = 10;

  /* ここから */
  //const width = canvas.width*1.5;
  //const height = canvas.height*4;
  //const width = video.clientwidth;
  //const height = video.clientheight;
  const width = canvas.width;
  const height = canvas.height;

  let videoMatNow = new cv.Mat(height, width, cv.CV_8UC4);

  //canvas.width = width;
  //canvas.height = height;


  //設定するパラメータ//
  const pilot_S = [
    [[255,0,0],[255,0,0],[0,255,0]],
    [[255,0,0],[255,0,0],[0,0,0]],
    [[255,0,255],[0,0,0],[0,0,255]],
  ];
  let color_kyoyou = [5,10,5];
  let ave_area = 10;
  size_y = 180;
  size_x = 180;


  //変数宣言・固定値の準備//
  //配列の足し算
  function add(a,b) {
    let result = [0,0,0];
    for(let i=0; i<3; i++){
      result[i] = a[i] + b[i];
    }
    return result;
  }

  //配列の引き算
  function sub(a,b) {
    let result = [0,0,0];
    for(let i=0; i<3; i++){
      result[i] = a[i] - b[i];
    }
    return result;
  }

  const pilot_S_lower = [
    [sub(pilot_S[0][0],color_kyoyou),sub(pilot_S[0][1],color_kyoyou),sub(pilot_S[0][2],color_kyoyou)],
    [sub(pilot_S[1][0],color_kyoyou),sub(pilot_S[1][1],color_kyoyou),sub(pilot_S[1][2],color_kyoyou)],
    [sub(pilot_S[2][0],color_kyoyou),sub(pilot_S[2][1],color_kyoyou),sub(pilot_S[2][2],color_kyoyou)],
  ];

  const pilot_S_upper = [
    [add(pilot_S[0][0],color_kyoyou),add(pilot_S[0][1],color_kyoyou),add(pilot_S[0][2],color_kyoyou)],
    [add(pilot_S[1][0],color_kyoyou),add(pilot_S[1][1],color_kyoyou),add(pilot_S[1][2],color_kyoyou)],
    [add(pilot_S[2][0],color_kyoyou),add(pilot_S[2][1],color_kyoyou),add(pilot_S[2][2],color_kyoyou)],
  ];

  let ave_position = [
    [[0,0,0],[0,0,0],[0,0,0]],
    [[0,0,0],[0,0,0],[0,0,0]],
    [[0,0,0],[0,0,0],[0,0,0]],
  ];
  let T_num_detectAnker = 0;
  let T_num_judgeMarker = 0;
  let detectedMarker_Flag = 0;




  processVideo();

  function processVideo() {
    console.log("Frame");
    try{
      const begin = Date.now();
  
      // ctx.drawImage(video, 0, 0, width, height);
      ctx.drawImage(video, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
      // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  
      // videoMatPre.copyTo(videoMatNow);
      // videoMatNow.data.set(ctx.getImageData(0, 0, width, height).data);
      videoMatNow = cv.matFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      /*
      let colorRed = new cv.Scalar(255,0,0);
      let size = 300
      cv.rectangle(videoMatNow, new cv.Point(canvas.width/2-size/2,canvas.height/2-size/2), new cv.Point(canvas.width/2+size/2,canvas.height/2+size/2), colorRed, 1);
      cv.imshow("canvas", videoMatNow);
      */
      // videoMatNow.data.set(cv.matFromImageData(imageData));


      //let data = videoMatNow.ucharPtr(100,100)

      //detect_marker();
      
      //console.log(pilot_S[0][0][0]+color_kyoyou[0]);
      //T_num_detectAnker = 3;

      detectedMarker_Flag = 0;
      detect_marker();
      

      //マーカの検出
      function detect_marker() {
        for(let y=0; y<height/3; y++){          //1/3しているの忘れずに!//
          for(let x=0; x<width/3; x++){
            let data = videoMatNow.ucharPtr(y,x);
            compare_for_detectAnker(data);      
            if(T_num_detectAnker>0){            //マーカ[0,0]の色ならjudge_marker()へ
              judge_marker(y,x);
            }
            if(detectedMarker_Flag){             //マーカが見つかったならjudge_signal()へ
              judge_signal(y,x)
              //マーカ検出終了
            }
          }
        }
        console.log("マーカーが見つからない");
      }

      //配列の各要素の比較
      function compare_for_detectAnker(data) {
        T_num_detectAnker = 0;
        for(let i=0; i<3; i++){
          if(pilot_S_lower[0][0][i] < data[i] && data[i] < pilot_S_upper[0][0][i]){
            T_num_detectAnker++;
            //console.log(T_num_detectAnker, pilot_S[0][0][i]-color_kyoyou[i], "<", data[i], "<" ,pilot_S[0][0][i]+color_kyoyou[i]);
          }
        }
      }

      //配列の各要素の足し算
      function add(a,b) {
        let result = [0,0,0];
        for(let i=0; i<3; i++){
          result[i] = a[i] + b[i];
        }
        return result;
      }

      //配列の各要素の引き算
      function sub(a,b) {
        let result = [0,0,0];
        for(let i=0; i<3; i++){
          result[i] = a[i] - b[i];
        }
        return result;
      }

      //配列の各要素に対する割り算
      function div(a,b) {
        let result = [0,0,0];
        for(let i=0; i<3; i++){
          result[i] = a[i]/b;
        }
        return result;
      }

      //配列の各要素の比較
      function compare_for_judgeMarker(py,px) {
        T_num_judgeMarker = 0;
        for(let i=0; i<3; i++){
          if(pilot_S_lower[py][px][i] < ave_position[py][px][i] && ave_position[py][px][i] < pilot_S_upper[py][px][i]){
            T_num_judgeMarker++;
          }
        }
      }
    
      //平均値の計算
      function average(anky,ankx,py,px){
        let ave_temp = [0,0,0];
        //for(let py=0; y<ave_position.length; y++){        //計算量短縮のため、1つずつ
          //for(let px=0; x<ave_position[0].length; x++){
            for(let y=0; y<ave_area; y++){
              for(let x=0; x<ave_area; x++){
                ave_temp = add(ave_temp,videoMatNow.ucharPtr(anky+parseInt(size_y/6)*(py*2+1)-parseInt(ave_area/2), ankx+parseInt(size_x/6)*(px*2+1)-parseInt(ave_area/2)));
              }
            }
            ave_position[py][px] = div(ave_temp,ave_area*ave_area);
            //ave_temp = [0,0,0];
          //}
        //}
      }
      
      //マーカーであるかを判定
      function judge_marker(anky,ankx) {
        average(anky,ankx,0,0);           //position[0,0]の検査
        compare_for_judgeMarker(0,0);
        if(T_num_judgeMarker>0){
          average(anky,ankx,0,1);         //position[0,1]へ
          compare_for_judgeMarker(0,1);   
          if(T_num_judgeMarker>0){
            average(anky,ankx,1,0);       //position[1,0]へ
            compare_for_judgeMarker(0,1);   
          }
          if(T_num_judgeMarker>0){
            detectedMarker_Flag = 1;
          }
        }
      }

      //配列の各要素の比較
      function compare_for_judgeSignal(py,px) {
        T_num_judgeSignal = 0;
        for(let i=0; i<3; i++){
          if(pilot_S_lower[py][px][i] < ave_position[1][1][i] && ave_position[1][1][i] < pilot_S_upper[py][px][i]){
            T_num_judgeSignal++;
          }
        }
      }
      
      //信号の判定
      function judge_signal(anky,ankx) {
        average(anky,ankx,1,1);
        compare_for_judgeSignal(0,0);
        if(T_num_judgeSignal>0){
          console.log("トートバック")
        }
        else{
          compare_for_judgeSignal(0,2);
          if(T_num_judgeSignal>0){
            console.log("コップ")
          }
          else{
            compare_for_judgeSignal(2,2);
            if(T_num_judgeSignal>0){
              console.log("Tシャツ")
            }
            else{
              compare_for_judgeSignal(2,0);
              if(T_num_judgeSignal>0){
                console.log("キャンバス")
              }
              else{
                console.log("信号に該当しない")
              }
            }
          }
        }
        //検出終了
      }
      

  
      /*
      // ２値化
      cv.cvtColor(videoMatNow, blackAndWhiteMatNow, cv.COLOR_RGB2GRAY);
      if(read_flag !=0){
        cv.cvtColor(videoMatPre, blackAndWhiteMatPre, cv.COLOR_RGB2GRAY);
        // cv.imshow("canvas", blackAndWhiteMatPre);
      }
      // cv.imshow("canvas", blackAndWhiteMatNow);
      */
    
      /*
      if(read_flag != 0){
        // 差分取得
        let diffMat = new cv.Mat(height, width, cv.CV_8UC1);
        cv.absdiff(blackAndWhiteMatNow, blackAndWhiteMatPre, diffMat);
        cv.imshow("canvas", diffMat);
  
        // 矩形検出
        // let rect = new cv.Rect(100, 100, 200, 200);
        // let dst = diffMat.roi(rect);
        // cv.imshow("canvas", dst);
  
        // 線分検出 LSD
        // const detector = new LSD();
        // const lines = detector.detect(diffMat);
        // detector.drawSegments(ctx, lines);
      }
  
      videoMatPre = videoMatNow.clone();
      // cv.line(videoMatPre, (10,10), (10, 11), (255, 0, 0), 1);
      // cv.imshow("canvas", videoMatPre);
  
      // キャンバス上に線を描画
      // ctx.beginPath();       // 新しいパスを開始
      // ctx.moveTo(10, 10);    // ペンを (30, 50) へ移動
      // ctx.lineTo(11, 10);  // 直線を (150, 100) へ描く
      // ctx.stroke();          // パスを描画
      */

      const delay = 1000 / FPS - (Date.now() - begin);
  
      setTimeout(processVideo, delay);
      // processVideo();
  
    }catch(e){
      location.reload();
    }
  }
};


function errorCallback(err) {
  alert(err);
};




