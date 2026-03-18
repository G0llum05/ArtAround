const btn = document.getElementById("test-btn");
const container = document.getElementById("test-container");
const url = "https://api.thecatapi.com/v1/images/search";

async function catto() {
  try{
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const imgUrl = data[0].url;

    container.innerHTML = `<img src="${imgUrl}" alt="Gatto casuale" style="max-width: 400px; height: auto;">`;
  }
  catch(err){
    console.log("OPS");
    container.innerHTML = `<img src="/images/Gaberooooooo.png" alt="Gatto casuale" style="width:400px; height: auto;">`;
  }
}

btn.addEventListener("click", catto);
