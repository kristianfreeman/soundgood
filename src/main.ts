import { app, BrowserWindow, ipcMain, dialog, shell, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import * as ffprobeStatic from 'ffprobe-static';

// Set ffmpeg paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
ffmpeg.setFfprobePath(ffprobeStatic.path);

let mainWindow: BrowserWindow | null = null;

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

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: path.join(__dirname, '../icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('process-video', async (event: IpcMainInvokeEvent, inputPath: string, settings: ProcessingSettings): Promise<string> => {
  try {
    const outputPath = inputPath.replace(/\.[^/.]+$/, '_soundgood.mp4');
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k'
        ]);

      const audioFilters: string[] = [];

      if (settings.enableHighPass) {
        audioFilters.push(`highpass=f=${settings.highPassFreq}`);
      }

      if (settings.enableCompressor) {
        // Convert threshold from dB to linear (0-1 range)
        const thresholdLinear = Math.pow(10, parseFloat(settings.compressorThreshold) / 20);
        // Convert makeup gain from dB to linear
        const makeupGain = Math.pow(10, parseFloat(settings.compressorMakeup) / 20);
        // Attack and release are in milliseconds
        audioFilters.push(`acompressor=threshold=${thresholdLinear}:ratio=${settings.compressorRatio}:attack=${settings.compressorAttack}:release=${settings.compressorRelease}:makeup=${makeupGain}`);
      }

      if (settings.enableNormalize) {
        const targetLUFS = settings.targetLoudness || '-16';
        audioFilters.push(`loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11`);
      }

      if (audioFilters.length > 0) {
        command.audioFilters(audioFilters);
        console.log('Applying audio filters:', audioFilters);
      }

      command
        .on('progress', (progress: any) => {
          if (progress.percent) {
            event.sender.send('processing-progress', progress.percent);
          }
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (err: Error) => {
          reject(err);
        })
        .save(outputPath);
    });
  } catch (error) {
    throw error;
  }
});


ipcMain.handle('open-file-dialog', async (): Promise<string | null> => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('show-in-folder', async (_event: IpcMainInvokeEvent, filePath: string) => {
  shell.showItemInFolder(filePath);
});