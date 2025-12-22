<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Game Title') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|press-start-2p:400" rel="stylesheet" />

    <!-- Styles / Scripts -->
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @else
        <script src="https://cdn.tailwindcss.com"></script>
    @endif

    <style>
        body::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            /* Placeholder Light Fantasy Background */
            background: linear-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.8)), 
                        url('https://images.unsplash.com/photo-1638848600742-5cb658b4b7c6?q=80&w=2070&auto=format&fit=crop'); 
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
        }
        .pixel-font {
            font-family: 'Press Start 2P', cursive; /* Fallback if not loaded, though link is above */
        }
    </style>
</head>
<body class="antialiased text-gray-800 min-h-screen flex flex-col items-center">

    <!-- Main Container -->
    <div class="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col">
        
        <!-- Header / Nav -->
        <header class="w-full py-6 flex justify-between items-center border-b border-gray-200/50 mb-8 bg-white/40 backdrop-blur-sm rounded-b-lg px-4 shadow-sm">
            <div class="text-2xl font-bold tracking-wider text-gray-800 pixel-font drop-shadow-sm">
                GAME WORLD
            </div>

            @if (Route::has('login'))
                <nav class="flex gap-4">
                    @auth
                        <a href="{{ url('/dashboard') }}" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-white rounded font-semibold transition border border-yellow-600 shadow-sm">
                            Dashboard
                        </a>
                    @else
                        <a href="{{ route('login') }}" class="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded transition border border-gray-300 shadow-sm font-medium">
                            Log in
                        </a>

                        @if (Route::has('register'))
                            <a href="{{ route('register') }}" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-white rounded font-semibold transition border border-yellow-600 shadow-sm">
                                Register
                            </a>
                        @endif
                    @endauth
                </nav>
            @endif
        </header>

        <!-- Main Content Area -->
        <main class="flex-grow flex flex-col md:flex-row gap-6 mb-12">
            
            <!-- Left Panel (Main Info) -->
            <div class="flex-1 bg-white/90 backdrop-blur-md p-8 rounded-lg border border-white/40 shadow-xl">
                <h1 class="text-4xl md:text-5xl font-bold mb-6 text-gray-800 border-b pb-4 border-gray-200">
                    Welcome, Adventurer
                </h1>
                
                <p class="text-lg text-gray-600 leading-relaxed mb-8 font-medium">
                    Enter a world of infinite possibilities. Sharpen your skills, gather your party, and embark on a journey that will test your courage and wit.
                </p>

                <div class="space-y-4">
                    <div class="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-4">
                        <div class="text-3xl">⚔️</div>
                        <div>
                            <h3 class="font-bold text-gray-800 text-lg">Epic Battles</h3>
                            <p class="text-sm text-gray-600">Challenge formidable foes and earn legendary loot.</p>
                        </div>
                    </div>
                    <div class="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-start gap-4">
                        <div class="text-3xl">🏰</div>
                        <div>
                            <h3 class="font-bold text-gray-800 text-lg">Build Your Keep</h3>
                            <p class="text-sm text-gray-600">Construct a fortress to house your allies and treasures.</p>
                        </div>
                    </div>
                </div>

                <div class="mt-10 text-center md:text-left">
                     <a href="#" class="inline-block px-10 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-lg rounded-full shadow-lg transition transform hover:-translate-y-1 hover:scale-105 border-b-4 border-red-700">
                        START YOUR JOURNEY
                    </a>
                </div>
            </div>

            <!-- Right Panel (Updates / Side Content) -->
            <div class="w-full md:w-80 bg-white/80 backdrop-blur-md p-6 rounded-lg border border-white/40 shadow-lg h-fit">
                <h2 class="text-xl font-bold text-gray-700 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <span class="text-amber-500">🔔</span> Latest News
                </h2>
                
                <ul class="space-y-4 text-sm">
                    <li class="pb-2 border-b border-gray-100 last:border-0">
                        <span class="block text-xs text-gray-400 font-mono">2025.12.22</span>
                        <a href="#" class="text-blue-600 hover:text-blue-400 font-medium">New Expansion Announced!</a>
                    </li>
                    <li class="pb-2 border-b border-gray-100 last:border-0">
                        <span class="block text-xs text-gray-400 font-mono">2025.12.20</span>
                        <a href="#" class="text-gray-700 hover:text-blue-500">Maintenance Schedule Updated</a>
                    </li>
                    <li class="pb-2 border-b border-gray-100 last:border-0">
                        <span class="block text-xs text-gray-400 font-mono">2025.12.15</span>
                        <a href="#" class="text-gray-700 hover:text-blue-500">Winter Event starts now</a>
                    </li>
                </ul>

                <div class="mt-8 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded border border-indigo-100 shadow-inner">
                    <h3 class="font-bold text-indigo-800 mb-2 text-center">Server Status</h3>
                    <div class="flex items-center justify-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm mx-auto w-fit">
                        <span class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                        <span class="text-green-600 font-bold text-xs uppercase">Online</span>
                    </div>
                </div>
            </div>

        </main>

        <!-- Footer -->
        <footer class="py-6 text-center text-sm text-gray-600 border-t border-gray-200/50 bg-white/30 backdrop-blur-sm rounded-t-lg mx-4">
            &copy; 2025 Eazy RPG Game. All rights reserved.
        </footer>

    </div>
</body>
</html>
