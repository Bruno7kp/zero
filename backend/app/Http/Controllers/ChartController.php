<?php

namespace App\Http\Controllers;

use App\Models\Chart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChartController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Retorna todos os charts do usuário autenticado
        return Auth::user()->charts;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'data' => 'nullable|json',
        ]);

        // Cria o chart para o usuário autenticado
        $chart = Auth::user()->charts()->create([
            'name' => $validatedData['name'],
            'data' => $validatedData['data'] ? json_decode($validatedData['data'], true) : null,
        ]);

        return response()->json($chart, 201);
    }
}
