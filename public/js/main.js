'use strict';

const category = document.querySelector('input[name=category]');
const title = document.querySelector('input[name=title]');
const details = document.querySelector('input[name=details]');
const mediafile = document.querySelector('input[name=mediafile]');
const delbtn = document.getElementById('delbtn')
const updateBtn = document.getElementById('updatebtn')

const frm = document.querySelector('#mediaform');
const img = document.querySelector('#image');
const aud = document.querySelector('#aud');
const vid = document.querySelector('#vid');
const imgDiv = document.getElementById('img');

let response;
let currentId;

const updateImg = e => {

  response.forEach(res => {
    if (res.mId == e) {
      currentId = e;
      category.value = res.category;
      title.value = res.title;
      details.value = res.details;

    }
  });


};

const updatePost =  async (e) => {
  e.preventDefault()
    console.log(currentId);

    const fd = new FormData(frm);
  fd.append('id', currentId)
  const settings = {
    method: 'post',
    body: fd,
  };

   await fetch('/update', settings);
   updateView()

}

const deleteImg = async (evt) => {

  evt.preventDefault();

  fetch(`/delete?category=${category.value}&title=${title.value}&details=${details.value}`);
  updateView()

}


const getmedia = async () => await (await fetch('/getmedia')).json();

const updateView = async () => {
  while (imgDiv.firstChild) {
    imgDiv.removeChild(imgDiv.firstChild);
  }
  response = await getmedia();

  response.forEach(img => {
    const imgel = document.createElement('img');
    imgel.src = img.thumb_img;
    imgel.id = 'upload_img';
    imgel.name = img.mId;
    imgDiv.appendChild(imgel);

  });
  const images = document.querySelectorAll('#upload_img');
  images.forEach(
      img => img.addEventListener('click', e => updateImg(e.target.name)));

  return response;
};

updateView();

const sendForm = async (evt) => {
  evt.preventDefault();
  const fd = new FormData(frm);
  const settings = {
    method: 'post',
    body: fd,
  };

  await fetch('/upload', settings);
  updateView();
};

frm.addEventListener('submit', sendForm);
delbtn.addEventListener('click', deleteImg)
updateBtn.addEventListener('click', updatePost)



