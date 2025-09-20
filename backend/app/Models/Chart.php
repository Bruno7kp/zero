<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chart extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'source',
        'lastfm_username',
        'start_date',
        'day_of_week',
        'timezone',
        'music_cutoff',
        'album_cutoff',
        'artist_cutoff',
        'formula_name',
        'music_points_weight',
        'music_plays_weight',
        'album_points_weight',
        'album_plays_weight',
        'music_gold_value',
        'music_platinum_value',
        'music_diamond_value',
        'album_gold_value',
        'album_platinum_value',
        'album_diamond_value',
    ];

    /**
     * Get the user that owns the chart.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
