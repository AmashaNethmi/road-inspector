const { execSync } = require('child_process');
try {
  const result = execSync('C:/Users/laksh/Desktop/abc/RepairAreaSegmentation/backend/.venv/Scripts/python.exe -c "import ctypes; print(123)"');
  console.log('SUCCESS:', result.toString());
} catch (e) {
  console.error('ERROR:', e.message);
  console.error('STDOUT:', e.stdout ? e.stdout.toString() : '');
  console.error('STDERR:', e.stderr ? e.stderr.toString() : '');
}
