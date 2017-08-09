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

function processMove(delta) {
  if (offset * 4 === data.length) {
    sendCanvas(index++);
    offset = 0;
  }

  const r = offset * 4 + 0;
  const g = offset * 4 + 1;
  const b = offset * 4 + 2;
  const a = offset * 4 + 3;

  let {
    clientX,
    clientY,
    time,
  } = delta;

  if (time >= 255) {
    data[r] = 128;
    data[g] = 128;
    data[b] = 255;
    data[a] = 255;

    offset += 1;

    return processMove({
      clientX,
      clientY,
      time: time - 255,
    });
  }

  clientX = Math.min(clientX, 127);
  clientX = Math.max(clientX, -128);
  clientY = Math.min(clientY, 127);
  clientY = Math.max(clientY, -128);

  data[r] = clientX + 128;
  data[g] = clientY + 128;
  data[b] = time;
  data[a] = 255;

  offset += 1;

  ctx.putImageData(imageData, 0, 0);

  if (clientX !== delta.clientX || clientY !== delta.clientY) {
    return processMove({
      clientX: delta.clientX - clientX,
      clientY: delta.clientY - clientY,
      time: 0,
    });
  }
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

document.addEventListener('click', (ev) => {
  canvas.toBlob((blob) => {
  //   const req = new Request(`/tile/1`, {
  //     body: blob,
  //     cache: 'no-store',
  //     headers: {
  //       'Content-Type': 'image/png',
  //     },
  //     method: 'PUT',
  //     mode: 'cors',
  //   });
  //   fetch(req);
    console.log(data.length, blob.size);
  }, 'image/png');
});
