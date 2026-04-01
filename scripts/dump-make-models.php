<?php
$file = file_get_contents(__DIR__ . '/../phpseeders/CarMakeAndModelSeeder.php');
$needle = 'protected $make_and_models = ';
$pos = strpos($file, $needle);
if ($pos === false) {
    fwrite(STDERR, "needle not found\n");
    exit(1);
}
$i = $pos + strlen($needle);
if ($file[$i] !== '[') {
    fwrite(STDERR, "expected [\n");
    exit(1);
}
$depth = 0;
$start = $i;
$len = strlen($file);
for (; $i < $len; $i++) {
    $ch = $file[$i];
    if ($ch === '[') {
        $depth++;
    } elseif ($ch === ']') {
        $depth--;
        if ($depth === 0) {
            $slice = substr($file, $start, $i - $start + 1);
            $tmp = sys_get_temp_dir() . '/make_models_eval_' . uniqid() . '.php';
            file_put_contents($tmp, "<?php\n return $slice;\n");
            $data = include $tmp;
            unlink($tmp);
            echo json_encode($data);
            exit(0);
        }
    }
}
fwrite(STDERR, "unbalanced\n");
exit(1);
