class Mesh {
    constructor(gl, data) {
        this.gl = gl;
        this.indexCount = data.indices.length;

        // Create and bind VAO
        const vao = gl.createVertexArray();
        if (!vao) throw new Error('Failed to create vertex array object');
        this.vao = vao;
        gl.bindVertexArray(this.vao);

        // Create and bind VBO
        const vbo = gl.createBuffer();
        if (!vbo) throw new Error('Failed to create vertex buffer');
        this.vbo = vbo;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

        // Calculate stride and create interleaved data
        const hasNormals = !!data.normals;
        const hasUVs = !!data.uvs;
        const stride = (3 + (hasNormals ? 3 : 0) + (hasUVs ? 2 : 0)) * Float32Array.BYTES_PER_ELEMENT;
        
        // Create interleaved vertex data
        const vertexCount = data.vertices.length / 3;
        const interleavedData = new Float32Array(vertexCount * (3 + (hasNormals ? 3 : 0) + (hasUVs ? 2 : 0)));
        
        let offset = 0;
        for (let i = 0; i < vertexCount; i++) {
            // Position
            interleavedData[offset++] = data.vertices[i * 3];
            interleavedData[offset++] = data.vertices[i * 3 + 1];
            interleavedData[offset++] = data.vertices[i * 3 + 2];

            // Normal
            if (hasNormals) {
                interleavedData[offset++] = data.normals[i * 3];
                interleavedData[offset++] = data.normals[i * 3 + 1];
                interleavedData[offset++] = data.normals[i * 3 + 2];
            }

            // UV
            if (hasUVs) {
                interleavedData[offset++] = data.uvs[i * 2];
                interleavedData[offset++] = data.uvs[i * 2 + 1];
            }
        }

        gl.bufferData(gl.ARRAY_BUFFER, interleavedData, gl.STATIC_DRAW);

        // Create and bind EBO
        const ebo = gl.createBuffer();
        if (!ebo) throw new Error('Failed to create element buffer');
        this.ebo = ebo;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

        // Set up vertex attributes
        let attributeOffset = 0;
        
        // Position attribute
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, attributeOffset);
        attributeOffset += 3 * Float32Array.BYTES_PER_ELEMENT;

        // Normal attribute
        if (hasNormals) {
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, attributeOffset);
            attributeOffset += 3 * Float32Array.BYTES_PER_ELEMENT;
        }

        // UV attribute
        if (hasUVs) {
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, attributeOffset);
        }

        // Unbind VAO
        gl.bindVertexArray(null);
    }

    render(shader, modelMatrix) {
        shader.use();
        shader.setUniformMatrix4fv('uModel', modelMatrix);

        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
    }

    dispose() {
        this.gl.deleteBuffer(this.vbo);
        this.gl.deleteBuffer(this.ebo);
        this.gl.deleteVertexArray(this.vao);
    }
} 