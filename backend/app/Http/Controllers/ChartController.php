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
            'start_date' => 'required|date',
            'day_of_week' => 'required|integer',
            'source' => 'required|string|max:255',
            'lastfm_username' => 'nullable|string|max:255',
            'timezone' => 'required|string|max:255',
            'music_cutoff' => 'required|integer',
            'album_cutoff' => 'required|integer',
            'artist_cutoff' => 'required|integer',
            'formula_name' => 'required|string|max:255',
            'music_points_weight' => 'required|numeric',
            'music_plays_weight' => 'required|numeric',
            'album_points_weight' => 'required|numeric',
            'album_plays_weight' => 'required|numeric',
            'music_gold_value' => 'required|integer',
            'music_platinum_value' => 'required|integer',
            'music_diamond_value' => 'required|integer',
            'album_gold_value' => 'required|integer',
            'album_platinum_value' => 'required|integer',
            'album_diamond_value' => 'required|integer',
        ]);

        // Cria o chart para o usuário autenticado, incluindo o campo 'data'
        $chart = Auth::user()->charts()->create($validatedData);

        return response()->json($chart, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Chart $chart)
    {
        // Valida o usuário autenticado
        if (Auth::id() !== $chart->user_id) {
            abort(403, 'Unauthorized action.');
        }

        // 2. Validate the incoming data
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'start_date' => 'sometimes|required|date',
            'day_of_week' => 'sometimes|required|integer',
            'source' => 'sometimes|required|string|max:255',
            'lastfm_username' => 'sometimes|nullable|string|max:255',
            'timezone' => 'sometimes|required|string|max:255',
            'music_cutoff' => 'sometimes|required|integer',
            'album_cutoff' => 'sometimes|required|integer',
            'artist_cutoff' => 'sometimes|required|integer',
            'formula_name' => 'sometimes|required|string|max:255',
            'music_points_weight' => 'sometimes|required|numeric',
            'music_plays_weight' => 'sometimes|required|numeric',
            'album_points_weight' => 'sometimes|required|numeric',
            'album_plays_weight' => 'sometimes|required|numeric',
            'music_gold_value' => 'sometimes|required|integer',
            'music_platinum_value' => 'sometimes|required|integer',
            'music_diamond_value' => 'sometimes|required|integer',
            'album_gold_value' => 'sometimes|required|integer',
            'album_platinum_value' => 'sometimes|required|integer',
            'album_diamond_value' => 'sometimes|required|integer',
        ]);

        $chart->update($validatedData);

        return response()->json($chart);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Chart $chart)
    {
        // 1. Autorizar a ação
        // Garante que o usuário autenticado é o dono do chart
        if (Auth::id() !== $chart->user_id) {
            abort(403, 'Unauthorized action.');
        }

        // 2. Deletar o chart
        $chart->delete();

        // 3. Retornar uma resposta de sucesso
        return response()->json(null, 204);
    }
}
