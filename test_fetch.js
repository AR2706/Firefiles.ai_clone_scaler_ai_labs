const url = "https://firefiles-ai-clone-scaler-ai-labs.onrender.com/api/meetings/upload";
fetch(url, { method: "POST" })
  .then(res => console.log(res.status, res.statusText))
  .catch(err => console.error(err));
