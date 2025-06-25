const { ipcRenderer } = require('electron');
const path = require('path');

interface VideoFile {
  name: string;
  path?: string;
  filePath?: string;
}

interface ProcessingSettings {
  enableHighPass: boolean;
  highPassFreq: string;
  enableCompressor: boolean;
  compressorThreshold: string;
  compressorRatio: string;
  compressorAttack: string;
  compressorRelease: string;
  compressorMakeup: string;
  enableNormalize: boolean;
  targetLoudness: string;
}

let selectedFile: VideoFile | null = null;
let processedVideoPath: string | null = null;
let lastProcessedSettings: ProcessingSettings | null = null;
let settingsChanged = false;

const dropzone = document.getElementById('dropzone') as HTMLDivElement;
const videoPlayer = document.getElementById('videoPlayer') as HTMLVideoElement;
const processingOverlay = document.getElementById('processingOverlay') as HTMLDivElement;
const miniProgressFill = document.getElementById('miniProgressFill') as HTMLDivElement;
const audioToggle = document.getElementById('audioToggle') as HTMLDivElement;
const toggleBtn = document.getElementById('toggleAudio') as HTMLButtonElement;
const toggleLabel = document.querySelector('.toggle-label') as HTMLSpanElement;
const result = document.getElementById('result') as HTMLDivElement;
const outputPath = document.getElementById('outputPath') as HTMLSpanElement;
const openFolderBtn = document.getElementById('openFolderBtn') as HTMLButtonElement;
const regenerateSection = document.getElementById('regenerateSection') as HTMLDivElement;
const regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;

// Dropzone functionality
dropzone.addEventListener('click', async () => {
  console.log('Dropzone clicked');
  try {
    const filePath = await ipcRenderer.invoke('open-file-dialog');
    console.log('File path received:', filePath);
    if (filePath) {
      const fileNameStr = path.basename(filePath);
      handleFileSelect({ 
        name: fileNameStr, 
        path: filePath,
        filePath: filePath 
      });
    }
  } catch (error) {
    console.error('Error opening file dialog:', error);
  }
});

dropzone.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  
  const files = e.dataTransfer?.files;
  if (files && files.length > 0 && files[0].type.startsWith('video/')) {
    handleFileSelect(files[0] as any);
  }
});

async function handleFileSelect(file: VideoFile): Promise<void> {
  selectedFile = file;
  
  // Get the actual file path - in Electron, dropped files have a path property
  if (file.path) {
    selectedFile.filePath = file.path;
  }
  
  // Display video
  const videoPath = selectedFile.filePath || selectedFile.path;
  if (videoPath) {
    // Hide dropzone, show video
    dropzone.style.display = 'none';
    videoPlayer.style.display = 'block';
    videoPlayer.src = `file://${videoPath}`;
    
    // Show clear button
    clearBtn.style.display = 'block';
    
    // Auto-start processing
    await processVideo();
  }
}

// Preset definitions
const presets: Record<string, Partial<ProcessingSettings>> = {
  light: {
    highPassFreq: '60',
    compressorThreshold: '-20',
    compressorRatio: '2.5',
    compressorAttack: '10',
    compressorRelease: '150',
    compressorMakeup: '3'
  },
  standard: {
    highPassFreq: '80',
    compressorThreshold: '-12',
    compressorRatio: '4',
    compressorAttack: '5',
    compressorRelease: '100',
    compressorMakeup: '6'
  },
  aggressive: {
    highPassFreq: '100',
    compressorThreshold: '-8',
    compressorRatio: '6',
    compressorAttack: '3',
    compressorRelease: '80',
    compressorMakeup: '8'
  },
  ultra: {
    highPassFreq: '120',
    compressorThreshold: '-6',
    compressorRatio: '10',
    compressorAttack: '1',
    compressorRelease: '50',
    compressorMakeup: '12'
  }
};

// Settings value updates
const settingsMap: Record<string, string> = {
  highPassFreq: 'highPassValue',
  compressorThreshold: 'thresholdValue',
  compressorRatio: 'ratioValue',
  compressorAttack: 'attackValue',
  compressorRelease: 'releaseValue',
  compressorMakeup: 'makeupValue',
  targetLoudness: 'targetLoudnessValue'
};

Object.keys(settingsMap).forEach(inputId => {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const valueSpan = document.getElementById(settingsMap[inputId]) as HTMLSpanElement;
  
  input.addEventListener('input', () => {
    let value: string = input.value;
    if (inputId === 'compressorRatio') {
      value = parseFloat(value).toFixed(1);
    } else if (inputId === 'compressorAttack') {
      value = parseFloat(value).toFixed(1);
    }
    valueSpan.textContent = value;
    checkSettingsChanged();
  });
});

// Preset icons mapping
const presetIcons: Record<string, string> = {
  light: 'fa-feather',
  standard: 'fa-microphone',
  aggressive: 'fa-rocket',
  ultra: 'fa-fire'
};

// Preset select handler
const presetSelect = document.getElementById('presetSelect') as HTMLSelectElement;
const presetIcon = document.getElementById('presetIcon') as HTMLElement;

presetSelect.addEventListener('change', (e) => {
  const target = e.target as HTMLSelectElement;
  const presetName = target.value;
  
  if (presetName && presets[presetName]) {
    // Update icon
    presetIcon.className = `fas ${presetIcons[presetName]} preset-icon`;
    
    // Apply preset values
    const preset = presets[presetName];
    Object.keys(preset).forEach(key => {
      const input = document.getElementById(key) as HTMLInputElement;
      if (input) {
        input.value = preset[key as keyof ProcessingSettings] as string;
        // Trigger input event to update display
        input.dispatchEvent(new Event('input'));
      }
    });
    
    checkSettingsChanged();
  }
});

// Disable/enable controls based on checkbox state
const enableHighPass = document.getElementById('enableHighPass') as HTMLInputElement;
const highPassFreq = document.getElementById('highPassFreq') as HTMLInputElement;

enableHighPass.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  highPassFreq.disabled = !target.checked;
  checkSettingsChanged();
});

const enableCompressor = document.getElementById('enableCompressor') as HTMLInputElement;
enableCompressor.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  const controls = ['compressorThreshold', 'compressorRatio', 'compressorAttack', 'compressorRelease', 'compressorMakeup'];
  controls.forEach(id => {
    const element = document.getElementById(id) as HTMLInputElement;
    element.disabled = !target.checked;
  });
  checkSettingsChanged();
});

const enableNormalize = document.getElementById('enableNormalize') as HTMLInputElement;
const targetLoudness = document.getElementById('targetLoudness') as HTMLInputElement;

enableNormalize.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  targetLoudness.disabled = !target.checked;
  checkSettingsChanged();
});

// Get current settings
function getCurrentSettings(): ProcessingSettings {
  return {
    enableHighPass: (document.getElementById('enableHighPass') as HTMLInputElement).checked,
    highPassFreq: (document.getElementById('highPassFreq') as HTMLInputElement).value,
    enableCompressor: (document.getElementById('enableCompressor') as HTMLInputElement).checked,
    compressorThreshold: (document.getElementById('compressorThreshold') as HTMLInputElement).value,
    compressorRatio: (document.getElementById('compressorRatio') as HTMLInputElement).value,
    compressorAttack: (document.getElementById('compressorAttack') as HTMLInputElement).value,
    compressorRelease: (document.getElementById('compressorRelease') as HTMLInputElement).value,
    compressorMakeup: (document.getElementById('compressorMakeup') as HTMLInputElement).value,
    enableNormalize: (document.getElementById('enableNormalize') as HTMLInputElement).checked,
    targetLoudness: (document.getElementById('targetLoudness') as HTMLInputElement).value
  };
}

// Check if settings have changed
function checkSettingsChanged(): void {
  if (!lastProcessedSettings || !processedVideoPath) return;
  
  const currentSettings = getCurrentSettings();
  const hasChanged = JSON.stringify(currentSettings) !== JSON.stringify(lastProcessedSettings);
  
  if (hasChanged !== settingsChanged) {
    settingsChanged = hasChanged;
    regenerateSection.style.display = hasChanged ? 'block' : 'none';
  }
}

// Process video function
async function processVideo(): Promise<void> {
  if (!selectedFile) return;
  
  const settings = getCurrentSettings();
  
  // Show processing overlay
  processingOverlay.style.display = 'flex';
  result.style.display = 'none';
  
  try {
    processedVideoPath = await ipcRenderer.invoke('process-video', selectedFile.filePath || selectedFile.path, settings);
    outputPath.textContent = path.basename(processedVideoPath);
    
    // Store the settings used for this processing
    lastProcessedSettings = settings;
    settingsChanged = false;
    
    // Hide processing overlay, show result and toggle
    processingOverlay.style.display = 'none';
    result.style.display = 'block';
    audioToggle.style.display = 'block';
    regenerateSection.style.display = 'none';
    
    // Default to enhanced video
    isEnhanced = true;
    videoPlayer.src = `file://${processedVideoPath}`;
    toggleBtn.classList.add('enhanced');
    toggleLabel.textContent = 'Enhanced Audio';
  } catch (error: any) {
    processingOverlay.style.display = 'none';
    alert('Error processing video: ' + error.message);
  }
}

// Progress updates
ipcRenderer.on('processing-progress', (_event: any, percent: number) => {
  const progress = Math.round(percent) || 0;
  miniProgressFill.style.width = progress + '%';
});

// Show in folder
openFolderBtn.addEventListener('click', async () => {
  if (!processedVideoPath) return;
  
  await ipcRenderer.invoke('show-in-folder', processedVideoPath);
});

// Regenerate button
regenerateBtn.addEventListener('click', async () => {
  await processVideo();
});

// Clear button
clearBtn.addEventListener('click', () => {
  // Reset everything
  selectedFile = null;
  processedVideoPath = null;
  lastProcessedSettings = null;
  settingsChanged = false;
  isEnhanced = false;
  
  // Reset UI
  dropzone.style.display = 'flex';
  videoPlayer.style.display = 'none';
  videoPlayer.src = '';
  processingOverlay.style.display = 'none';
  audioToggle.style.display = 'none';
  result.style.display = 'none';
  regenerateSection.style.display = 'none';
  clearBtn.style.display = 'none';
  
  // Reset toggle button
  toggleBtn.classList.remove('enhanced');
  toggleLabel.textContent = 'Original Audio';
});

// Collapsible settings functionality
const settingHeaders = document.querySelectorAll('.setting-header');
settingHeaders.forEach(header => {
  header.addEventListener('click', (e) => {
    // Don't toggle if clicking on the checkbox or label
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'LABEL' || target.closest('label')) return;
    
    const toggleId = header.getAttribute('data-toggle');
    const controls = document.getElementById(`${toggleId}-controls`);
    
    if (controls) {
      header.classList.toggle('collapsed');
      controls.classList.toggle('collapsed');
    }
  });
});

// Audio toggle functionality
let isEnhanced = false;
toggleBtn.addEventListener('click', () => {
  if (!processedVideoPath || !selectedFile) return;
  
  const currentTime = videoPlayer.currentTime;
  const wasPaused = videoPlayer.paused;
  
  isEnhanced = !isEnhanced;
  
  if (isEnhanced) {
    videoPlayer.src = `file://${processedVideoPath}`;
    toggleBtn.classList.add('enhanced');
    toggleLabel.textContent = 'Enhanced Audio';
  } else {
    const originalPath = selectedFile.filePath || selectedFile.path;
    videoPlayer.src = `file://${originalPath}`;
    toggleBtn.classList.remove('enhanced');
    toggleLabel.textContent = 'Original Audio';
  }
  
  // Restore playback position
  videoPlayer.addEventListener('loadedmetadata', () => {
    videoPlayer.currentTime = currentTime;
    if (!wasPaused) {
      videoPlayer.play();
    }
  }, { once: true });
});