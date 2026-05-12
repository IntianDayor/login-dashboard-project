<?php
function getConn() {
    global $conn;
    return $conn;
}

function sess_open($path, $name) { return true; }
function sess_close() { return true; }

function sess_read($id) {
    $conn = getConn();
    if (!$conn) return '';
    $stmt = $conn->prepare("SELECT data FROM sessions WHERE id = ? AND expires > NOW()");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    return $row ? $row['data'] : '';
}

function sess_write($id, $data) {
    $conn = getConn();
    if (!$conn) return false;
    $lifetime = (int) ini_get('session.gc_maxlifetime') ?: 3600;
    $expires = date('Y-m-d H:i:s', time() + $lifetime);
    $stmt = $conn->prepare("
        INSERT INTO sessions (id, data, expires) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE data = VALUES(data), expires = VALUES(expires)
    ");
    $stmt->bind_param("sss", $id, $data, $expires);
    return $stmt->execute();
}

function sess_destroy($id) {
    $conn = getConn();
    if (!$conn) return false;
    $stmt = $conn->prepare("DELETE FROM sessions WHERE id = ?");
    $stmt->bind_param("s", $id);
    return $stmt->execute();
}

function sess_gc($maxlifetime) {
    $conn = getConn();
    if (!$conn) return false;
    $conn->query("DELETE FROM sessions WHERE expires < NOW()");
    return $conn->affected_rows >= 0 ? $conn->affected_rows : true;
}

session_set_save_handler('sess_open','sess_close','sess_read','sess_write','sess_destroy','sess_gc');
register_shutdown_function('session_write_close');
?>