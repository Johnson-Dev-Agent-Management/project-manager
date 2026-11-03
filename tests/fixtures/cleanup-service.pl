use strict;
use warnings;
use IO::Socket::INET;
use IO::Select;
use JSON::PP;
use File::Basename qw(dirname);

# MSYS Perl (bundled with Git Bash) honors POSIX signals, unlike native Windows
# Python/Node processes terminated through MSYS. Keep this fixture alive on TERM.
my $kind = shift @ARGV;
my $root = $ENV{CLEANUP_TEST_ROOT};
my $option = $kind eq 'api' ? '--urls' : '--port';
my $value;
while (@ARGV) {
    my $argument = shift @ARGV;
    $value = shift @ARGV if $argument eq $option;
}
die "missing $option" unless defined $value;
my $port = $value;
if ($kind eq 'api') {
    ($port) = $value =~ m{^http://127\.0\.0\.1:(\d+)$};
} else {
    die 'wrong API proxy target' unless $ENV{API_URL} eq "http://127.0.0.1:$ENV{PROJECT_DEV_API_PORT}";
}
my $expected = $kind eq 'api' ? $ENV{PROJECT_DEV_API_PORT} : $ENV{PROJECT_DEV_WEB_PORT};
die 'wrong service port' unless defined $port && $port eq $expected;
my ($database) = $ENV{ConnectionStrings__Projects} =~ /^Data Source=(.*)$/;
my $listener = IO::Socket::INET->new(
    LocalAddr => '127.0.0.1', LocalPort => $port,
    Listen => 5, ReuseAddr => 1,
) or die "listen: $!";
$SIG{TERM} = sub {
    open my $term, '>', "$root/$kind.term" or die $!;
    print {$term} "ignored\n";
    close $term;
};
open my $db, '>>', $database or die $!;
print {$db} "synthetic cleanup fixture\n";
close $db;
if ($ENV{CLEANUP_TEST_NO_ACK}) {
    mkdir(dirname($database) . '/cleanup-complete');
}
open my $state, '>', "$root/$kind.json" or die $!;
print {$state} encode_json({pid => $$, parent => $ENV{CLEANUP_TEST_PARENT}, database => $database, port => 0 + $port});
close $state;
my $ready = IO::Select->new($listener);
my @projects;
while (1) {
    next unless $ready->can_read(0.05);
    my $client = $listener->accept() or next;
    my $request = <$client>;
    if (!defined $request) { close $client; next; }
    my ($method, $path) = split / /, $request;
    my $length = 0;
    while (my $header = <$client>) {
        last if $header =~ /^\r?\n$/;
        $length = $1 if $header =~ /^Content-Length:\s*(\d+)/i;
    }
    my $input = '';
    read($client, $input, $length) if $length;
    my ($status, $body) = (200, encode_json(\@projects));
    if ($path eq '/api/health') {
        $status = 503 unless -f "$root/api.json";
        $body = '{"status":"ok"}';
    } elsif ($ENV{CLEANUP_TEST_FAILURE} && $method eq 'GET') {
        $body = '[{"id":99,"name":"force EXIT cleanup"}]';
    } elsif ($method eq 'POST') {
        my $name = decode_json($input)->{name};
        $name =~ s/^\s+|\s+$//g;
        push @projects, {id => 1, name => $name};
        ($status, $body) = (201, encode_json($projects[0]));
    }
    print {$client} "HTTP/1.0 $status Fixture\r\nContent-Type: application/json\r\nContent-Length: "
        . length($body) . "\r\n\r\n$body";
    close $client;
}
