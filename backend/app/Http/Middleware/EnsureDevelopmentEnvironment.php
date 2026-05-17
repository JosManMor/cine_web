<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureDevelopmentEnvironment
{
    public function handle(Request $request, Closure $next): mixed
    {
        if (!app()->isLocal()) {
            abort(404);
        }

        return $next($request);
    }
}
