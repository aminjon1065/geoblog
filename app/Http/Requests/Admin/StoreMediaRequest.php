<?php

namespace App\Http\Requests\Admin;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;

class StoreMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Media::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * SVG is intentionally excluded: it permits embedded <script> and external resource
     * loads. Re-enable only after introducing a server-side SVG sanitizer (e.g.
     * enshrined/svg-sanitize) and routing all SVG uploads through it.
     *
     * `mimetypes:` validates the actual MIME type detected from file contents rather than
     * just the extension, which closes the spoofed-extension hole that `mimes:` leaves
     * open.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'min:1', 'max:20'],
            'files.*' => [
                'required',
                'file',
                'max:10240',
                'mimetypes:'.implode(',', [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ]),
            ],
            // Optional: bind every uploaded file in this batch to a target folder.
            // Null means "drop into root" — consistent with how media rows are stored.
            'folder_id' => ['nullable', 'integer', 'exists:media_folders,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'files.*.mimetypes' => 'Only JPG, PNG, GIF, WebP, PDF, DOC, and DOCX files are allowed. SVG and executable formats are blocked.',
            'files.*.max' => 'Each file must be 10 MB or smaller.',
            'files.max' => 'You can upload a maximum of 20 files at once.',
        ];
    }
}
