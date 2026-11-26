"""Find verified PDF alternatives without treating temporary failures as missing."""
from urllib.parse import quote, unquote, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def safe_url(url):
    # Source filenames may contain literal hashes rather than URL fragments.
    parsed = urlsplit(url.replace('#', '%23'))
    return urlunsplit((parsed.scheme, parsed.netloc, quote(unquote(parsed.path), safe='/'), parsed.query, ''))


def candidates(url, known, repository=None):
    options = [url]
    mapped = known.get(url)
    if isinstance(mapped, str):
        options.append(mapped)
    elif isinstance(mapped, dict) and mapped.get('resolvedUrl'):
        options.append(mapped['resolvedUrl'])
    parsed = urlsplit(url)
    repositories = [repository] if repository else []
    if parsed.hostname == 's6-fresh-teacher.vercel.app':
        repositories.extend(['s6-notes', 's6-past-papers'])
    for repo in repositories:
        options.append(f'https://raw.githubusercontent.com/Fresh-Teacher/{quote(repo, safe="-")}/HEAD/{parsed.path.lstrip("/")}')
    return list(dict.fromkeys(safe_url(option) for option in options))


def verify_pdf(url):
    try:
        request = Request(safe_url(url), headers={'Range': 'bytes=0-1023', 'User-Agent': 'FreshTeacher-LinkCheck/1.0'})
        with urlopen(request, timeout=15) as response:
            prefix = response.read(1024)
            return {'status': 'verified' if prefix.lstrip().startswith(b'%PDF-') else 'not_pdf'}
    except HTTPError as error:
        return {'status': 'missing' if error.code in (404, 410) else 'retry'}
    except (URLError, TimeoutError, OSError):
        return {'status': 'retry'}


def resolve(original, options, cache):
    retry = False
    for option in dict.fromkeys(options):
        result = cache.get(option)
        if not isinstance(result, dict) or result.get('status') != 'verified':
            result = verify_pdf(option)
        cache[option] = result
        if result.get('status') == 'verified':
            return {**result, 'originalUrl': original, 'resolvedUrl': option}
        retry = retry or result.get('status') == 'retry'
    return {'originalUrl': original, 'status': 'retry' if retry else 'missing'}