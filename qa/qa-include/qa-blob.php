<?php
/*
	Question2Answer by Gideon Greenspan and contributors
	http://www.question2answer.org/

	File: qa-include/qa-blob.php
	Description: Response to blob requests, outputting blob from the database


	This program is free software; you can redistribute it and/or
	modify it under the terms of the GNU General Public License
	as published by the Free Software Foundation; either version 2
	of the License, or (at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	More about this license: http://www.question2answer.org/license.php
*/


// Ensure no PHP errors are shown in the blob response

@ini_set('display_errors', 0);

function qa_blob_db_fail_handler()
{
	header('HTTP/1.1 500 Internal Server Error');
	qa_exit('error');
}


// Load the Q2A base file which sets up a bunch of crucial stuff

require 'qa-base.php';

qa_report_process_stage('init_blob');


// Output the blob in question

require_once QA_INCLUDE_DIR.'app/blobs.php';

qa_db_connect('qa_blob_db_fail_handler');

$blob = qa_read_blob(qa_get('qa_blobid'));

if (isset($blob) && isset($blob['content'])) {
	// allows browsers and proxies to cache the blob (30 days)
	header('Cache-Control: max-age=2592000, public');

	$disposition = 'inline';

	switch ($blob['format']) {
		case 'jpeg':
		case 'jpg':
			header('Content-Type: image/jpeg');
			break;

		case 'gif':
			header('Content-Type: image/gif');
			break;

		case 'png':
			header('Content-Type: image/png');
			break;

		case 'pdf':
			header('Content-Type: application/pdf');
			break;

		case 'swf':
			header('Content-Type: application/x-shockwave-flash');
			break;

		default:
			header('Content-Type: application/octet-stream');
			$disposition = 'attachment';
			break;
	}

	// for compatibility with HTTP headers and all browsers
	$filename = preg_replace('/[^A-Za-z0-9 \\._-]+/', '', $blob['filename']);
	header('Content-Disposition: '.$disposition.'; filename="'.$filename.'"');

	echo $blob['content'];

} else {
	header('HTTP/1.0 404 Not Found');
}

qa_db_disconnect();
