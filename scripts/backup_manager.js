/**
 * TRAINER OS - BACKUP & ROLLBACK (UNDO) MANAGER
 * Hỗ trợ tạo bản chụp (snapshot), hoàn tác (undo/rollback) và quản lý backlog an toàn.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_ROOT = path.join(PROJECT_ROOT, '_backups');
const BACKLOG_FILE = path.join(PROJECT_ROOT, 'BACKLOG.md');

// Đảm bảo thư mục _backups tồn tại
if (!fs.existsSync(BACKUP_ROOT)) {
    fs.mkdirSync(BACKUP_ROOT, { recursive: true });
}

function getTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function getFormattedDate() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Lấy danh sách file cần backup (HTML, JS, TXT, MD, JSON)
function getSourceFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
        if (entry.name === '_backups' || entry.name === 'node_modules' || entry.name === '.git') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.html', '.js', '.txt', '.md', '.json', '.gitignore'].includes(ext)) {
                files.push(fullPath);
            }
        }
    }
    return files;
}

// 1. TẠO BẢN SAO LƯU (SNAPSHOT)
function createSnapshot(description = 'Manual checkpoint') {
    const ts = getTimestamp();
    const cleanDesc = description.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_').slice(0, 40);
    const snapshotName = `snapshot_${ts}_${cleanDesc}`;
    const targetDir = path.join(BACKUP_ROOT, snapshotName);

    fs.mkdirSync(targetDir, { recursive: true });

    const files = getSourceFiles(PROJECT_ROOT);
    let copiedCount = 0;

    for (const f of files) {
        const dest = path.join(targetDir, path.basename(f));
        fs.copyFileSync(f, dest);
        copiedCount++;
    }

    // Ghi metadata file
    const meta = {
        snapshotId: snapshotName,
        createdAt: new Date().toISOString(),
        formattedDate: getFormattedDate(),
        description: description,
        filesCount: copiedCount
    };
    fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf8');

    // Cập nhật BACKLOG.md
    if (fs.existsSync(BACKLOG_FILE)) {
        let backlog = fs.readFileSync(BACKLOG_FILE, 'utf8');
        const entry = `| **\`${snapshotName}\`** | \`${getFormattedDate()}\` | ✅ Đã lưu (\`_backups/${snapshotName}\`) | ${description} (${copiedCount} files) |\n`;
        if (backlog.includes('## 📦 DANH SÁCH BẢN SAO LƯU CỤC BỘ')) {
            backlog = backlog.replace(/(## 📦 DANH SÁCH BẢN SAO LƯU CỤC BỘ[^\n]*\n\n\|[^\n]*\n\|[^\n]*\n)/, `$1${entry}`);
            fs.writeFileSync(BACKLOG_FILE, backlog, 'utf8');
        }
    }

    console.log(`✅ [BACKUP TẠO THÀNH CÔNG] Mã: ${snapshotName}`);
    console.log(`   - Số file lưu vết: ${copiedCount}`);
    console.log(`   - Thư mục: _backups/${snapshotName}`);
    return snapshotName;
}

// 2. LIỆT KÊ DANH SÁCH BẢN SAO LƯU
function listSnapshots() {
    const entries = fs.readdirSync(BACKUP_ROOT, { withFileTypes: true });
    const snapshots = [];

    for (const e of entries) {
        if (e.isDirectory()) {
            const metaFile = path.join(BACKUP_ROOT, e.name, 'metadata.json');
            let info = { snapshotId: e.name, description: 'No description', formattedDate: '--', filesCount: 0 };
            if (fs.existsSync(metaFile)) {
                try {
                    info = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
                } catch (err) {}
            } else {
                const count = fs.readdirSync(path.join(BACKUP_ROOT, e.name)).length;
                info.filesCount = count;
            }
            snapshots.push(info);
        }
    }

    snapshots.sort((a, b) => b.snapshotId.localeCompare(a.snapshotId));

    console.log('\n📦 DANH SÁCH CÁC BẢN SAO LƯU (BACKLOG SNAPSHOTS):');
    console.log('--------------------------------------------------------------------------------');
    if (snapshots.length === 0) {
        console.log('   (Chưa có bản backup nào)');
    } else {
        snapshots.forEach((s, idx) => {
            console.log(`[${idx + 1}] ID: ${s.snapshotId}`);
            console.log(`    Thời gian : ${s.formattedDate || '--'}`);
            console.log(`    Mô tả     : ${s.description || 'Baseline'}`);
            console.log(`    Số files  : ${s.filesCount}`);
            console.log('--------------------------------------------------------------------------------');
        });
    }
    return snapshots;
}

// 3. HOÀN TÁC / QUAY VỀ PHIÊN BẢN TRƯỚC (ROLLBACK)
function rollbackTo(targetSnapshotId) {
    if (!targetSnapshotId) {
        console.error('❌ Vui lòng cung cấp mã snapshot cần rollback! (Dùng lệnh list để xem mã)');
        process.exit(1);
    }

    const sourceDir = path.join(BACKUP_ROOT, targetSnapshotId);
    if (!fs.existsSync(sourceDir)) {
        console.error(`❌ Không tìm thấy bản backup có mã [${targetSnapshotId}] trong thư mục _backups!`);
        process.exit(1);
    }

    console.log(`\n🔄 BẮT ĐẦU QUY TRÌNH ROLLBACK (UNDO) VỀ PHIÊN BẢN: ${targetSnapshotId}`);

    // BƯỚC 3.1: Tự động chụp ngay một bản "Cứu hộ an toàn" (Safety checkpoint) của trạng thái hiện tại
    console.log('1. Đang tạo điểm phục hồi an toàn trước khi hoàn tác...');
    const safetyTs = getTimestamp();
    const safetyDir = path.join(BACKUP_ROOT, `safety_before_rollback_${safetyTs}`);
    fs.mkdirSync(safetyDir, { recursive: true });

    const currentFiles = getSourceFiles(PROJECT_ROOT);
    for (const f of currentFiles) {
        fs.copyFileSync(f, path.join(safetyDir, path.basename(f)));
    }
    console.log(`   -> Đã lưu chốt an toàn tại: _backups/safety_before_rollback_${safetyTs}`);

    // BƯỚC 3.2: Khôi phục toàn bộ file từ snapshot mục tiêu vào thư mục làm việc
    console.log('2. Đang khôi phục các tệp từ bản backup mục tiêu...');
    const backupFiles = fs.readdirSync(sourceDir);
    let restoredCount = 0;

    for (const file of backupFiles) {
        if (file === 'metadata.json') continue;
        const srcFile = path.join(sourceDir, file);
        const destFile = path.join(PROJECT_ROOT, file);
        fs.copyFileSync(srcFile, destFile);
        restoredCount++;
    }

    console.log(`   -> Đã khôi phục thành công ${restoredCount} tệp mã nguồn!`);

    // BƯỚC 3.3: Ghi nhận sự kiện Rollback vào BACKLOG.md
    if (fs.existsSync(BACKLOG_FILE)) {
        let backlog = fs.readFileSync(BACKLOG_FILE, 'utf8');
        const entry = `| **\`rollback_${safetyTs}\`** | \`${getFormattedDate()}\` | 🔄 ĐÃ HOÀN TÁC (ROLLBACK) | Hoàn tác toàn bộ hệ thống về mốc [${targetSnapshotId}] (${restoredCount} files khôi phục) |\n`;
        if (backlog.includes('## 📦 DANH SÁCH BẢN SAO LƯU CỤC BỘ')) {
            backlog = backlog.replace(/(## 📦 DANH SÁCH BẢN SAO LƯU CỤC BỘ[^\n]*\n\n\|[^\n]*\n\|[^\n]*\n)/, `$1${entry}`);
            fs.writeFileSync(BACKLOG_FILE, backlog, 'utf8');
        }
    }

    console.log('3. Hoàn tất cập nhật BACKLOG.md!');
    console.log(`\n🎉 [HOÀN TÁC THÀNH CÔNG] Toàn bộ mã nguồn đã quay về nguyên trạng phiên bản: ${targetSnapshotId}\n`);
}

// 4. HỖ TRỢ HOÀN TÁC GIT COMMIT (GIT UNDO)
function undoLastGitCommit(mode = 'soft') {
    const gitPath = 'C:\\Users\\vi.nln\\AppData\\Local\\Programs\\Git\\cmd\\git.exe';
    if (!fs.existsSync(gitPath)) {
        console.error('❌ Không tìm thấy git.exe!');
        return;
    }

    try {
        if (mode === 'soft') {
            console.log('🔄 Đang hoàn tác Commit gần nhất (giữ nguyên file đang sửa để bạn kiểm tra lại)...');
            execSync(`"${gitPath}" -C "${PROJECT_ROOT}" reset --soft HEAD~1`, { stdio: 'inherit' });
            console.log('✅ Đã rút lại commit gần nhất! Các file sửa đổi vẫn được giữ nguyên để bạn preview và tinh chỉnh.');
        } else if (mode === 'revert') {
            console.log('🔄 Đang tạo commit đảo ngược (git revert) an toàn trên GitHub...');
            execSync(`"${gitPath}" -C "${PROJECT_ROOT}" revert HEAD --no-edit`, { stdio: 'inherit' });
            console.log('✅ Đã tạo commit đảo ngược phiên bản an toàn, sẵn sàng đẩy lên GitHub.');
        }
    } catch (err) {
        console.error('❌ Lỗi thao tác Git:', err.message);
    }
}

// 5. ĐÓNG GÓI THƯ MỤC VER N+ & COMMIT GITHUB (CHỈ CHẠY KHI USER PHÊ DUYỆT "OKE")
function releaseVersionFolderAndCommit(verFolderName, commitMessage = 'Release new version') {
    const parentRoot = path.resolve(PROJECT_ROOT, '..');
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateSuffix = `${pad(d.getDate())}${pad(d.getMonth() + 1)}${String(d.getFullYear()).slice(-2)}`;
    const folderName = verFolderName || `he-thong-quan-tri-v3-${dateSuffix}`;
    const targetVerDir = path.join(parentRoot, folderName);

    // 1. Tạo snapshot nội bộ trước
    const snapId = createSnapshot(`Release_${folderName}`);

    // 2. Tạo thư mục ver n+ song song với v1, v2
    if (!fs.existsSync(targetVerDir)) {
        fs.mkdirSync(targetVerDir, { recursive: true });
    }
    const files = getSourceFiles(PROJECT_ROOT);
    let copied = 0;
    for (const f of files) {
        fs.copyFileSync(f, path.join(targetVerDir, path.basename(f)));
        copied++;
    }
    console.log(`✅ [FOLDER VER N+] Đã tạo thư mục phiên bản mới: ${targetVerDir} (${copied} files)`);

    // 3. Commit & Push lên GitHub
    const gitPath = 'C:\\Users\\vi.nln\\AppData\\Local\\Programs\\Git\\cmd\\git.exe';
    if (fs.existsSync(gitPath)) {
        try {
            execSync(`"${gitPath}" -C "${PROJECT_ROOT}" add -A`, { stdio: 'inherit' });
            execSync(`"${gitPath}" -C "${PROJECT_ROOT}" commit -m "${commitMessage}"`, { stdio: 'inherit' });
            execSync(`"${gitPath}" -C "${PROJECT_ROOT}" push origin main`, { stdio: 'inherit' });
            console.log('🚀 [GITHUB SYNC] Đã commit & push thành công lên https://github.com/vinguyen14/camnang');
        } catch (err) {
            console.error('⚠️ Lưu ý khi push GitHub:', err.message);
        }
    }
    return { folderName, targetVerDir, snapId, copied };
}

// CLI Routing
const args = process.argv.slice(2);
const command = args[0] || 'list';

switch (command) {
    case 'create':
    case 'backup':
        createSnapshot(args[1] || 'Manual checkpoint');
        break;
    case 'list':
        listSnapshots();
        break;
    case 'rollback':
    case 'undo':
    case 'restore':
        rollbackTo(args[1]);
        break;
    case 'git-undo':
        undoLastGitCommit(args[1] || 'soft');
        break;
    case 'release':
        releaseVersionFolderAndCommit(args[1], args[2]);
        break;
    default:
        console.log('Sử dụng:');
        console.log('  node scripts/backup_manager.js list');
        console.log('  node scripts/backup_manager.js create "Mô tả bản backup"');
        console.log('  node scripts/backup_manager.js rollback <snapshot_id>');
        console.log('  node scripts/backup_manager.js git-undo [soft|revert]');
        console.log('  node scripts/backup_manager.js release <ten-folder-ver-n+> "Nội dung commit"');
        break;
}
