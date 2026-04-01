<?php
$file = file_get_contents(__DIR__ . '/../phpseeders/StatesAndCitiesTableSeeder.php');

function extractPhpArrayAfter(string $file, string $needle): array
{
    $pos = strpos($file, $needle);
    if ($pos === false) {
        throw new RuntimeException("not found: $needle");
    }
    $i = $pos + strlen($needle);
    while ($i < strlen($file) && ctype_space($file[$i])) {
        $i++;
    }
    if ($file[$i] !== '[') {
        throw new RuntimeException("expected [");
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
                $tmp = sys_get_temp_dir() . '/states_cities_' . uniqid() . '.php';
                file_put_contents($tmp, "<?php\n return $slice;\n");
                $data = include $tmp;
                unlink($tmp);
                return $data;
            }
        }
    }
    throw new RuntimeException('unbalanced');
}

$statesWithCities = extractPhpArrayAfter($file, 'protected $statesWithCities = ');
$cityAliases = extractPhpArrayAfter($file, 'protected $cityAliases = ');
echo json_encode(['statesWithCities' => $statesWithCities, 'cityAliases' => $cityAliases], JSON_UNESCAPED_UNICODE);
