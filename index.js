const [canvas] = document.getElementsByTagName('canvas');
const ctx = canvas.getContext('2d');
// const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const imageData = ctx.createImageData(canvas.width, canvas.height);
const { data } = imageData;

// ctx.fillStyle = 'green';
// ctx.fillRect(10, 10, 100, 100);

let i = 0;

let prevState = {
  clientX: 0,
  clientY: 0,
  time: Date.now(),
}

function sendCanvas(index) {
  canvas.toBlob((blob) => {
    const ratio = 100 * blob.size / data.length
    console.log(`Tile #${index} [ratio: ${ratio}%]`);

    const req = new Request(`/tile/${index}`, {
      body: blob,
      cache: 'no-store',
      headers: {
        'Content-Type': 'image/png',
      },
      method: 'PUT',
      mode: 'cors',
    });
    fetch(req);

  }, 'image/png');
}

let index = 0;
let offset = 0;

function checkFullAndSend() {
  if (offset * 4 === data.length) {
    sendCanvas(index++);
    offset = 0;
  }
}

function writePixel(delta) {
  checkFullAndSend();

  const {
    clientX,
    clientY,
    time,
  } = delta;

  const r = offset * 4 + 0;
  const g = offset * 4 + 1;
  const b = offset * 4 + 2;
  const a = offset * 4 + 3;

  data[r] = clientX + 128;
  data[g] = clientY + 128;
  data[b] = time;
  data[a] = 255;

  offset += 1;

  ctx.putImageData(imageData, 0, 0);
}

function checkTimeOverflow(delta) {
  if (delta.time >= 255) {
    delta.time -= 255;
    writePixel({
      clientX: 0,
      clientY: 0,
      time: 255,
    });

    checkTimeOverflow(delta);
  }
}

function checkTimeout() {
  const time = Date.now();

  if (time - prevState.time < 255) {
    return;
  }

  if (time - prevState.time >= 255) {
    prevState.time += 255;
    writePixel({
      clientX: 0,
      clientY: 0,
      time: 255,
    });
    checkTimeout();
  }
}

setInterval(checkTimeout, 256);

function processMove(delta) {
  checkTimeOverflow(delta);

  let {
    clientX,
    clientY,
    time,
  } = delta;

  clientX = Math.min(clientX, 127);
  clientX = Math.max(clientX, -128);
  clientY = Math.min(clientY, 127);
  clientY = Math.max(clientY, -128);

  if (clientX !== delta.clientX || clientY !== delta.clientY) {
    return processMove({
      clientX: delta.clientX - clientX,
      clientY: delta.clientY - clientY,
      time: 0,
    });
  }

  writePixel(delta);
}

document.addEventListener('mousemove', (ev) => {
  const {
    clientX,
    clientY,
  } = ev;
  const time = Date.now();

  const currState = {
    clientX,
    clientY,
    time,
  };

  const deltaState = Object.keys(currState).reduce((deltaState, name) => {
    deltaState[name] = currState[name] - prevState[name];
    return deltaState;
  }, {});

  prevState = currState;

  processMove(deltaState);
});
