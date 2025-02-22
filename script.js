// Improved and Refactored Code

// ------------------------------
// DOM Element References
// ------------------------------
const prompt = document.querySelector("#prompt");
const submitbtn = document.querySelector("#submit");
const chatContainer = document.querySelector(".chat-container");
const imagebtn = document.querySelector("#image");
const imagePreview = document.querySelector("#image img");
const imageinput = document.querySelector("#image input");
const clearChatBtn = document.getElementById("clearChat");
const voiceAssistantBtn = document.querySelector("#voiceAssistant");
const micIcon = document.querySelector("#micIcon");
const mathsAIbtn = document.getElementById("mathsAI");
const getWeatherBtn = document.querySelector("#getWeather");
const cityInput = document.querySelector("#cityInput");
const weatherContainer = document.querySelector("#weather");

// ------------------------------
// API Configuration
// ------------------------------
const Api_Url =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyD0ob8GO26DNiK0e3wgd0u5deOTdK37_ig";

// ------------------------------
// User State Object
// ------------------------------
let user = {
  message: null,
  file: null, // will hold { mime_type: "...", data: "..." }
  isMathsMode: false, // When true, Maths AI mode is active
};

// ------------------------------
// Helper Functions
// ------------------------------

// Create a chat box element and add the specified class
function createChatBox(html, cssClass) {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.classList.add(cssClass);
  return div;
}

// ------------------------------
// Generate AI Response
// ------------------------------
async function generateResponse(aiChatBox) {
  const textEl = aiChatBox.querySelector(".ai-chat-area");

  // Depending on the mode, use either the maths instruction or the regular message
  const instruction = user.isMathsMode
    ? "Solve this mathematical problem and show the steps:"
    : user.message;
  const parts = [{ text: instruction }];

  // If a file is attached (image), include it in the request
  if (user.file && user.file.data) {
    parts.push({ inline_data: user.file });
  }

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: parts,
        },
      ],
    }),
  };

  try {
    const response = await fetch(Api_Url, requestOptions);
    const data = await response.json();

    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0
    ) {
      const apiResponse = data.candidates[0].content.parts[0].text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim();
      textEl.innerHTML = apiResponse;
    } else {
      textEl.innerHTML = "Sorry, I couldn't process that.";
      console.error("Error in API response:", data);
    }
  } catch (error) {
    console.error("API request failed:", error);
    textEl.innerHTML = "Something went wrong. Please try again.";
  } finally {
    // Scroll to the latest chat message
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });

    // Clear image selection and file data
    imagePreview.src = "img.svg";
    imagePreview.classList.remove("choose");
    user.file = null;

    // Optional: If you want Maths mode to be automatically cleared after one submission, uncomment the next line.
    // user.isMathsMode = false;
  }
}

// ------------------------------
// Handle Chat Submission (Text or Image)
// ------------------------------
function handleChatResponse(userMessage) {
  // Do nothing if there is no text and no file attached
  if (!userMessage && !(user.file && user.file.data)) return;

  user.message = userMessage;

  // Build User Chat UI
  const userContent = `
    <img src="user.png" alt="User" id="userImage" width="8%">
    <div class="user-chat-area">
      ${user.message ? `<p>${user.message}</p>` : ""}
      ${
        user.file && user.file.data
          ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />`
          : ""
      }
    </div>`;
  const userChatBox = createChatBox(userContent, "user-chat-box");
  chatContainer.appendChild(userChatBox);
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth",
  });

  // Clear the prompt if needed
  prompt.value = "";

  // Build AI Chat UI with loading indicator
  setTimeout(() => {
    const aiContent = `
      <img src="ai.png" alt="AI" id="aiImage" width="10%">
      <div class="ai-chat-area">
        <img src="loading.webp" alt="Loading" class="load" width="50px">
      </div>`;
    const aiChatBox = createChatBox(aiContent, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox);
  }, 600);
}

// ------------------------------
// Handle Image File Input
// ------------------------------
function handleImageFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64string = e.target.result.split(",")[1];
    user.file = {
      mime_type: file.type,
      data: base64string,
    };

    // Show the image preview
    imagePreview.src = `data:${user.file.mime_type};base64,${user.file.data}`;
    imagePreview.classList.add("choose");

    // If Maths mode is active, immediately submit using this image as input.
    if (user.isMathsMode) {
      handleChatResponse(null);
    } else {
      // No additional action for normal mode
    }
  };
  reader.readAsDataURL(file);
}

// ------------------------------
// Event Listeners
// ------------------------------

// Submit chat when pressing Enter (ignores Shift+Enter for a newline)
prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChatResponse(prompt.value.trim());
  }
});

// Clicking the submit button
submitbtn.addEventListener("click", () =>
  handleChatResponse(prompt.value.trim())
);

// Trigger image file input when clicking the image button
imagebtn.addEventListener("click", () => {
  imageinput.click();
});

// Handle image changes (works for both Maths mode and normal mode)
imageinput.addEventListener("change", handleImageFileChange);

// Clear all chat messages when the clear chat button is clicked
clearChatBtn.addEventListener("click", () => {
  chatContainer.innerHTML = "";
});

// ------------------------------
// Maths AI Mode Toggle
// ------------------------------
mathsAIbtn.addEventListener("click", () => {
  user.isMathsMode = !user.isMathsMode;
  if (user.isMathsMode) {
    prompt.placeholder = "Upload a picture of the math problem";
    alert("Maths AI mode activated. Please upload a picture of the math problem.");
  } else {
    prompt.placeholder = "Type your message here...";
    imagePreview.src = "img.svg";
    imagePreview.classList.remove("choose");
    prompt.value = "";
    alert("Maths AI mode deactivated. You can now upload regular images.");
  }
});

// ------------------------------
// Voice Assistant Functionality
// ------------------------------
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    micIcon.src = "load.gif";
  };

  recognition.onend = () => {
    micIcon.src = "voice.svg";
  };

  // Consolidate recognized result handling via takeCommand()
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("Recognized Speech:", transcript);
    takeCommand(transcript);
  };

  voiceAssistantBtn.addEventListener("click", () => {
    recognition.start();
  });
} else {
  console.warn("SpeechRecognition API is not supported in this browser.");
}

// ------------------------------
// Text-to-Speech Utility
// ------------------------------
function speak(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.volume = 1;
  speech.rate = 1;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
}

// ------------------------------
// Handle Voice Commands or Text Queries
// ------------------------------
function takeCommand(message) {
  if (!message) return;

  if (message.includes("hello") || message.includes("hey")) {
    speak("Hello! How can I help you?");
  } else if (message.includes("who are you")) {
    speak("I am a virtual assistant, created by team Nova.");
  } else if (message.includes("open youtube")) {
    speak("Opening YouTube...");
    window.open("https://youtube.com/", "_blank");
  } else if (message.includes("open google")) {
    speak("Opening Google...");
    window.open("https://google.com/", "_blank");
  } else if (message.includes("open facebook")) {
    speak("Opening Facebook...");
    window.open("https://facebook.com/", "_blank");
  } else if (message.includes("open instagram")) {
    speak("Opening Instagram...");
    window.open("https://instagram.com/", "_blank");
  } else if (message.includes("open linkedin")) {
    speak("Opening LinkedIn...");
    window.open("https://linkedin.com/", "_blank");
  } else if (message.includes("time")) {
    const time = new Date().toLocaleTimeString();
    speak("The current time is " + time);
  } else if (message.includes("date")) {
    const date = new Date().toLocaleDateString();
    speak("Today's date is " + date);
  } else {
    // For any query not explicitly recognized, submit it as a chat request.
    handleChatResponse(message);
    speak("Searching for " + message);
  }
}

// ------------------------------
// Image Generator Functionality
// ------------------------------
const imageGeneratorSection = document.getElementById("imageGeneratorSection");
const chatbotSection = document.getElementById("chatbotSection");
const imgInput = document.getElementById("imgInput");
const generateBtn = document.getElementById("generateBtn");
const generatedImage = document.getElementById("generatedImage");
const loadingIndicator = document.getElementById("loading");
const downloadBtn = document.getElementById("download");
const resetBtn = document.getElementById("reset");
const backToChatBtn = document.getElementById("backToChat");
const modelSelect = document.getElementById("modelSelect");

const MODELS = {
  "stability-ai/stable-diffusion-2":
    "https://router.huggingface.co/hf-inference/models/cloudqi/cqi_text_to_image_pt_v0",
  "CompVis/stable-diffusion-v1-4":
    "https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4",
  "runwayml/stable-diffusion-v1-5":
    "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
  "sairajg/Text_To_Image":
    "https://router.huggingface.co/hf-inference/models/vcolamatteo/pokemon-text_to_image_",
  "ZB-Tech/Text-to-Image":
    "https://api-inference.huggingface.co/models/ZB-Tech/Text-to-Image",
};

async function generateImage() {
  const selectedModel = modelSelect.value;
  const imgPrompt = imgInput.value;
  if (!imgPrompt) return;

  generatedImage.style.display = "none";
  loadingIndicator.style.display = "block";

  try {
    const response = await fetch(MODELS[selectedModel], {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ "inputs": imgPrompt }),
    });

    const blob = await response.blob();
    const imageURL = URL.createObjectURL(blob);
    generatedImage.src = imageURL;
    generatedImage.style.display = "block";
  } catch (error) {
    console.error("Error generating image:", error);
  } finally {
    loadingIndicator.style.display = "none";
  }
}

generateBtn.addEventListener("click", generateImage);

// Switch to Image Generator Section
document.getElementById("imgGeneratorBtn").addEventListener("click", () => {
  chatbotSection.style.display = "none";
  imageGeneratorSection.style.display = "flex";
});

// Back to Chatbot Section
backToChatBtn.addEventListener("click", () => {
  imageGeneratorSection.style.display = "none";
  chatbotSection.style.display = "flex";
});

// Generate Image from Text
generateBtn.addEventListener("click", async () => {
  if (!imgInput.value) return;
  loadingIndicator.style.display = "block";
  try {
    const response = await fetch(IMAGE_API_URL, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ "inputs": imgInput.value }),
    });
    const result = await response.blob();
    generatedImage.src = URL.createObjectURL(result);
    generatedImage.style.display = "block";
  } catch (error) {
    console.error("Error generating image:", error);
  } finally {
    loadingIndicator.style.display = "none";
  }
});

// Reset Image Generator Section
resetBtn.addEventListener("click", () => {
  imgInput.value = "";
  generatedImage.src = "";
  generatedImage.style.display = "none";
});

// Download Generated Image
downloadBtn.addEventListener("click", () => {
  if (!generatedImage.src) return;
  const link = document.createElement("a");
  link.href = generatedImage.src;
  link.download = "generated-image.png";
  link.click();
});

document.getElementById("generateBtn").addEventListener("click", async () => {
  const imgInput = document.getElementById("imgInput").value;
  const generatedImage = document.getElementById("generatedImage");
  const loadingGif = document.getElementById("loadingGif");
  const selectedModel = document.getElementById("modelSelect").value;

  if (!imgInput) return;

  // Hide the old image and show the loading indicator
  generatedImage.style.display = "none";
  loadingGif.style.display = "block";

  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${selectedModel}`,
      {
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ "inputs": imgInput }),
      }
    );

    const blob = await response.blob();
    const imageURL = URL.createObjectURL(blob);

    // Load image into canvas
    const img = new Image();
    img.src = imageURL;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size the same as the image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0);

      // Set watermark properties
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; // White with transparency
      ctx.textAlign = "right";
      ctx.fillText("NovaX AI", canvas.width - 20, canvas.height - 20); // Bottom-right

      // Set the final image
      generatedImage.src = canvas.toDataURL("image/png");
      generatedImage.style.display = "block";
    };
  } catch (error) {
    console.error("Error generating image:", error);
  } finally {
    loadingGif.style.display = "none";
  }
});

const API_KEY = "AIzaSyA2SE4WwNw8X0RkzxlWqzF5cRnAz0n8Qs4"; // ✅ API Key 
const SHEET_ID = "1aEG-ut1syysscyUORte-rpUQ2_tOF6o_-BEcrZJ7wOk"; // ✅ Google Sheet ID 
const SHEET_NAME = "sd"; // ✅ Sheet tab

async function logUserSearch(prompt, model) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A1:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;

  const values = [[new Date().toISOString(), prompt || "No Prompt Given", model || "No Model Selected"]];

  const body = {
    range: `${SHEET_NAME}!A1`,
    majorDimension: "ROWS",
    values: values,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log("Google Sheet Response:", result);
  } catch (error) {
    console.error("Error logging data:", error);
  }
}

// ✅ Example Call
document.getElementById("generateBtn").addEventListener("click", () => {
  const imgInput = document.getElementById("imgInput").value;
  const selectedModel = document.getElementById("modelSelect").value;

  if (!imgInput) {
    logUserSearch("No Prompt Given", selectedModel);
  } else {
    logUserSearch(imgInput, selectedModel);
  }
});