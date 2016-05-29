<?php echo $this->getCssContent(); ?>
<table class="chart-table <?php if($fluid): echo 'table-fluid'; endif;?>" >
	<tr>
		<th>
			RANK
		</th>
		<th>
			<?php echo strtoupper($type);?>
		</th>
		<th>
			PLAYS
		</th>
	</tr>

	<?php
	foreach ($items as $item) {
	?>
	<tr>
		<td class="<?php echo $this->aux('getRankColor', $item->rank);?>">
			<?php echo $item->rank;?>
		</td>
		<td>
			<?php 
				echo $item->$type;
				if($type != "artist")
				{
					echo "<br><small>" . $item->artist . "</small>";
				}
			?>
		</td>
		<td>
			<?php echo $item->playcount;?>
		</td>
	</tr>
	<?php
	}
	?>
</table>